// Modalità scura: la scelta dell'utente deve vincere sul sistema automatico.
//
// Bug corretto: il tasto 🌙 salvava la scelta in una chiave separata, ma
// initDarkMode() (all'avvio) e checkSchedule() (ogni 60 secondi) la
// sovrascrivevano in base all'orologio (scuro solo dalle 20 alle 8). Attivata
// di giorno, la modalità scura tornava chiara entro un minuto.
//
// Esegue le funzioni reali di public/index.html in un contesto vm con body,
// storage e orologio finti. Nessuna rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start !== -1, `Funzione "${name}" non trovata`);
  let depth = 0;
  let i = html.indexOf('{', start);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

// "storage" è condiviso tra più ambienti per simulare un ricaricamento pagina.
function makeEnv({ storage = {}, night = false, storageThrows = false } = {}) {
  const classes = new Set();
  const sandbox = {
    document: { body: { classList: {
      add: (...c) => c.forEach(x => classes.add(x)),
      remove: (...c) => c.forEach(x => classes.delete(x)),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? classes.delete(c) : classes.add(c))
    } } },
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { if (storageThrows) throw new Error('QuotaExceededError'); storage[k] = String(v); }
    },
    // stessa semantica di loadFromStorage in index.html: JSON o fallback
    loadFromStorage: (k, fb) => { try { return k in storage ? JSON.parse(storage[k]) : fb; } catch { return fb; } },
    appState: { darkMode: false },
    setInterval: () => 0,
    console: { log() {}, error() {} },
    isNightTime: () => night
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `let darkModeSettings = { mode: 'auto', schedule: { start: '20:00', end: '08:00' }, enabled: false };\n` +
    ['applyDarkMode', 'checkSchedule', 'toggleDarkMode', 'initDarkMode'].map(extractFunction).join('\n'),
    sandbox
  );
  return {
    sandbox, storage,
    isDark: () => classes.has('dark-mode'),
    mode: () => vm.runInContext('darkModeSettings.mode', sandbox)
  };
}

test('di giorno: attivare la modalità scura resta attiva anche dopo il controllo automatico dei 60 secondi', () => {
  const env = makeEnv({ night: false });
  env.sandbox.initDarkMode();
  assert.equal(env.isDark(), false, 'di giorno, senza scelte, parte chiara');

  env.sandbox.toggleDarkMode();
  assert.equal(env.isDark(), true);

  env.sandbox.checkSchedule(); // il tick ogni 60 secondi
  assert.equal(env.isDark(), true, 'il controllo automatico non deve spegnere la scelta dell\'utente');
});

test('la scelta resta dopo aver ricaricato la pagina', () => {
  const first = makeEnv({ night: false });
  first.sandbox.initDarkMode();
  first.sandbox.toggleDarkMode(); // scuro, di giorno

  const reloaded = makeEnv({ storage: first.storage, night: false }); // stesso storage = ricaricamento
  reloaded.sandbox.initDarkMode();
  assert.equal(reloaded.isDark(), true);
  assert.equal(reloaded.mode(), 'dark');
});

test('di notte: chi sceglie il chiaro lo mantiene, il sistema automatico non lo riaccende', () => {
  const env = makeEnv({ night: true });
  env.sandbox.initDarkMode();
  assert.equal(env.isDark(), true, 'di notte, senza scelte, parte scura');

  env.sandbox.toggleDarkMode(); // l'utente passa al chiaro
  assert.equal(env.isDark(), false);
  env.sandbox.checkSchedule();
  assert.equal(env.isDark(), false);
  assert.equal(env.mode(), 'light');
});

test('chi aveva già scelto con il vecchio tasto (chiave "darkMode") viene rispettato', () => {
  const env = makeEnv({ storage: { darkMode: 'true' }, night: false });
  env.sandbox.initDarkMode();
  assert.equal(env.isDark(), true, 'scelta salvata dalla vecchia versione');
  assert.equal(env.mode(), 'dark');

  const light = makeEnv({ storage: { darkMode: 'false' }, night: true });
  light.sandbox.initDarkMode();
  assert.equal(light.isDark(), false);
});

test('senza nessuna scelta il sistema automatico continua a funzionare (scuro dalle 20 alle 8)', () => {
  const day = makeEnv({ night: false }); day.sandbox.initDarkMode();
  const night = makeEnv({ night: true }); night.sandbox.initDarkMode();
  assert.equal(day.isDark(), false);
  assert.equal(night.isDark(), true);
  assert.equal(day.mode(), 'auto');
});

test('il tasto si basa sullo stato reale: di notte (scuro automatico) il primo clic passa al chiaro', () => {
  const env = makeEnv({ night: true });
  env.sandbox.initDarkMode();
  env.sandbox.toggleDarkMode();
  assert.equal(env.isDark(), false, 'il primo clic deve fare ciò che l\'utente vede: spegnere lo scuro');
});

test('se il salvataggio fallisce (storage pieno) il tasto funziona comunque', () => {
  const env = makeEnv({ night: false, storageThrows: true });
  assert.doesNotThrow(() => env.sandbox.toggleDarkMode());
  assert.equal(env.isDark(), true);
});

// Slice 2 (bug localStorage) — vedi analisi in conversazione.
//
// Estrae loadFromStorage/saveToStorage/showStorageWarning dal sorgente reale
// di public/index.html (stessa tecnica di estrazione di
// tests/html-syntax.test.js) e le esegue in un contesto vm con un
// localStorage/document finti e controllabili — nessun browser, nessuna
// rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'public', 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

// Estrae solo il corpo delle tre funzioni, dal loro punto di definizione fino
// alla chiusura di setDarkMode/showStorageWarning incluse — evita di dover
// eseguire l'intero script inline (che tocca il DOM reale in molti altri
// punti a livello di top-level, fuori dallo scope di questo test).
function extractFunction(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start !== -1, `Funzione "${name}" non trovata in public/index.html`);

  let depth = 0;
  let i = html.indexOf('{', start);
  const bodyStart = i;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  assert.ok(depth === 0, `Parentesi non bilanciate estraendo "${name}"`);
  return html.slice(start, i + 1);
}

function makeSandbox({ throwOnSetItem = false, storage = {} } = {}) {
  const store = { ...storage };
  const fakeLocalStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      if (throwOnSetItem) {
        const err = new Error('QuotaExceededError (simulato)');
        err.name = 'QuotaExceededError';
        throw err;
      }
      store[key] = value;
    }
  };

  const createdElements = [];
  const fakeDocument = {
    getElementById: (id) => createdElements.find(el => el.id === id) || null,
    createElement: () => {
      const el = { id: '', className: '', innerHTML: '', appendedTo: null, removed: false };
      el.remove = () => { el.removed = true; };
      return el;
    },
    body: {
      appendChild: (el) => { el.appendedTo = 'body'; createdElements.push(el); }
    }
  };

  const consoleCalls = [];
  const fakeConsole = { error: (...args) => consoleCalls.push(args) };

  const sandbox = {
    localStorage: fakeLocalStorage,
    document: fakeDocument,
    console: fakeConsole,
    setTimeout: () => {}, // non serve eseguire l'auto-dismiss nel test
    consoleCalls,
    createdElements,
    store
  };
  vm.createContext(sandbox);
  return sandbox;
}

const loadFromStorageSrc = extractFunction('loadFromStorage');
const saveToStorageSrc = extractFunction('saveToStorage');
const showStorageWarningSrc = extractFunction('showStorageWarning');

// Confronto via JSON.stringify invece di assert.deepEqual: gli oggetti
// creati dentro il contesto vm appartengono a un altro "realm" (Object
// diverso da quello del processo Node ospite), quindi deepStrictEqual li
// considera diversi pur avendo la stessa struttura.
test('loadFromStorage: JSON valido viene restituito correttamente', () => {
  const sandbox = makeSandbox({ storage: { foo: JSON.stringify({ a: 1 }) } });
  vm.runInContext(`${loadFromStorageSrc}\nvar __result = loadFromStorage('foo', {});`, sandbox);
  assert.equal(JSON.stringify(sandbox.__result), JSON.stringify({ a: 1 }));
});

test('loadFromStorage: chiave assente restituisce il fallback', () => {
  const sandbox = makeSandbox();
  vm.runInContext(`${loadFromStorageSrc}\nvar __result = loadFromStorage('assente', { default: true });`, sandbox);
  assert.equal(JSON.stringify(sandbox.__result), JSON.stringify({ default: true }));
});

test('loadFromStorage: JSON corrotto NON lancia eccezione, restituisce il fallback', () => {
  const sandbox = makeSandbox({ storage: { corrotto: '{questo non è JSON valido' } });
  assert.doesNotThrow(() => {
    vm.runInContext(`${loadFromStorageSrc}\nvar __result = loadFromStorage('corrotto', { safe: true });`, sandbox);
  });
  assert.equal(JSON.stringify(sandbox.__result), JSON.stringify({ safe: true }));
});

test('saveToStorage: scrittura riuscita ritorna true, nessun avviso mostrato', () => {
  const sandbox = makeSandbox();
  vm.runInContext(
    `${showStorageWarningSrc}\n${saveToStorageSrc}\nvar __result = saveToStorage('k', { x: 1 });`,
    sandbox
  );
  assert.equal(sandbox.__result, true);
  assert.equal(sandbox.store.k, JSON.stringify({ x: 1 }));
  assert.equal(sandbox.createdElements.length, 0, 'nessun toast deve comparire su salvataggio riuscito');
});

test('saveToStorage: quota superata NON lancia eccezione, ritorna false, mostra un avviso e logga il dettaglio', () => {
  const sandbox = makeSandbox({ throwOnSetItem: true });
  assert.doesNotThrow(() => {
    vm.runInContext(
      `${showStorageWarningSrc}\n${saveToStorageSrc}\nvar __result = saveToStorage('k', { x: 1 });`,
      sandbox
    );
  });
  assert.equal(sandbox.__result, false);
  assert.equal(sandbox.createdElements.length, 1, 'deve comparire esattamente un avviso');
  assert.ok(sandbox.createdElements[0].innerHTML.includes('Rimarrà disponibile solo finché questa pagina resterà aperta'));
  assert.ok(!sandbox.createdElements[0].innerHTML.toLowerCase().includes('errore'), 'il messaggio non deve parlare di errore di generazione');
  assert.equal(sandbox.consoleCalls.length, 1, 'il dettaglio tecnico deve restare loggato in console per il debug');
});

test('showStorageWarning: chiamate multiple ravvicinate non duplicano il toast', () => {
  const sandbox = makeSandbox({ throwOnSetItem: true });
  vm.runInContext(
    `${showStorageWarningSrc}\n${saveToStorageSrc}\nsaveToStorage('a', 1); saveToStorage('b', 2);`,
    sandbox
  );
  assert.equal(sandbox.createdElements.length, 1, 'due salvataggi falliti di seguito devono produrre un solo avviso, non due');
});

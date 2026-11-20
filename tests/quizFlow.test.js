// Flusso del quiz — registrazione degli esiti e filtri "Sbagliate/Corrette/Non viste".
//
// Bug corretto: l'esito di ogni domanda veniva registrato solo da
// submitQuizAnswer(), raggiungibile dal pulsante "Conferma" che spariva non
// appena si cliccava un'opzione. Quindi quizStats restava sempre vuoto e i
// filtri risultavano inutilizzabili. In più il timer, mai fermato dopo la
// risposta, a 0 sovrascriveva la risposta già data con "nessuna risposta".
//
// Esegue le funzioni reali di public/index.html in un contesto vm con DOM,
// storage e timer finti. Nessuna rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start !== -1, `Funzione "${name}" non trovata in public/index.html`);
  let depth = 0;
  let i = html.indexOf('{', start);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  assert.equal(depth, 0, `Parentesi non bilanciate estraendo "${name}"`);
  return html.slice(start, i + 1);
}

const QUIZ = [
  { q: 'Domanda A', options: ['a1', 'a2', 'a3', 'a4'], correct: 1 },
  { q: 'Domanda B', options: ['b1', 'b2', 'b3', 'b4'], correct: 0 },
  { q: 'Domanda C', options: ['c1', 'c2', 'c3', 'c4'], correct: 2 }
];

function makeContext({ storageThrows = false } = {}) {
  const calls = { cleared: [], renders: 0, next: 0, storage: {}, errors: [] };
  const sandbox = {
    appState: { quizAnswers: [], currentQuizFiltered: 0, quizScore: 0, quizTimerId: 7, quizTimeRemaining: 60, quizMode: 'all' },
    quizStats: {},
    getCurrentStudy: () => ({ id: 1, data: { quiz: QUIZ } }),
    renderQuizAdvanced: () => { calls.renders++; },
    nextQuizQuestion: () => { calls.next++; },
    clearInterval: (id) => { calls.cleared.push(id); },
    setInterval: (fn) => { sandbox.__tick = fn; return 99; },
    document: { getElementById: () => null },
    localStorage: {
      setItem: (k, v) => {
        if (storageThrows) throw new Error('QuotaExceededError (simulato)');
        calls.storage[k] = v;
      }
    },
    console: { log() {}, error: (...a) => calls.errors.push(a) }
  };
  vm.createContext(sandbox);
  vm.runInContext(
    ['filterQuizByMode', 'recordQuizResult', 'selectQuizAnswer', 'startQuizTimer'].map(extractFunction).join('\n'),
    sandbox
  );
  return { sandbox, calls };
}

const plain = (v) => JSON.parse(JSON.stringify(v));

test('risposta giusta: registra l\'esito, aumenta il punteggio e persiste le statistiche', () => {
  const { sandbox, calls } = makeContext();
  sandbox.selectQuizAnswer(1); // Domanda A, giusta

  assert.deepEqual(plain(sandbox.appState.quizAnswers), [1]);
  assert.equal(sandbox.appState.quizScore, 1);
  assert.equal(plain(sandbox.quizStats)['1_Domanda A'].correct, true);
  assert.equal(plain(JSON.parse(calls.storage.quizStats))['1_Domanda A'].correct, true, 'deve finire anche in localStorage');
  assert.equal(calls.renders, 1);
});

test('risposta sbagliata: registrata come sbagliata, punteggio invariato', () => {
  const { sandbox } = makeContext();
  sandbox.selectQuizAnswer(3);

  assert.equal(sandbox.appState.quizScore, 0);
  assert.equal(plain(sandbox.quizStats)['1_Domanda A'].correct, false);
});

test('una seconda risposta alla stessa domanda viene ignorata (niente doppio conteggio)', () => {
  const { sandbox, calls } = makeContext();
  sandbox.selectQuizAnswer(1);
  sandbox.selectQuizAnswer(1);
  sandbox.selectQuizAnswer(3);

  assert.deepEqual(plain(sandbox.appState.quizAnswers), [1]);
  assert.equal(sandbox.appState.quizScore, 1);
  assert.equal(calls.renders, 1);
});

test('rispondere ferma il timer, così a 0 non può sovrascrivere la risposta data', () => {
  const { sandbox, calls } = makeContext();
  sandbox.selectQuizAnswer(1);

  assert.ok(calls.cleared.includes(7), 'clearInterval deve essere chiamato sul timer attivo');
  assert.equal(sandbox.appState.quizTimerId, null);
});

test('tempo scaduto: nessuna risposta, contata come sbagliata, poi si passa alla domanda successiva', () => {
  const { sandbox, calls } = makeContext();
  sandbox.startQuizTimer();
  for (let s = 0; s < 60; s++) sandbox.__tick();

  assert.deepEqual(plain(sandbox.appState.quizAnswers), [-1]);
  assert.equal(plain(sandbox.quizStats)['1_Domanda A'].correct, false);
  assert.equal(sandbox.appState.quizScore, 0);
  assert.equal(calls.next, 1, 'deve passare alla domanda successiva una sola volta');
});

test('un errore di salvataggio (storage pieno) non interrompe il quiz', () => {
  const { sandbox, calls } = makeContext({ storageThrows: true });
  assert.doesNotThrow(() => sandbox.selectQuizAnswer(1));

  assert.deepEqual(plain(sandbox.appState.quizAnswers), [1]);
  assert.equal(calls.renders, 1, 'il quiz deve proseguire e ridisegnarsi');
  assert.equal(calls.errors.length, 1, 'il problema resta tracciato in console');
});

test('i filtri funzionano: dopo aver risposto, "Sbagliate", "Corrette" e "Non viste" restituiscono le domande giuste', () => {
  const { sandbox } = makeContext();

  sandbox.appState.currentQuizFiltered = 0; sandbox.selectQuizAnswer(1); // A: giusta
  sandbox.appState.currentQuizFiltered = 1; sandbox.selectQuizAnswer(3); // B: sbagliata
  // C: mai risposta

  const names = (mode) => {
    sandbox.appState.quizMode = mode;
    return sandbox.filterQuizByMode(QUIZ).map(q => q.q);
  };

  assert.deepEqual(names('correct'), ['Domanda A']);
  assert.deepEqual(names('wrong'), ['Domanda B']);
  assert.deepEqual(names('unseen'), ['Domanda C']);
  assert.deepEqual(names('all'), ['Domanda A', 'Domanda B', 'Domanda C']);
});

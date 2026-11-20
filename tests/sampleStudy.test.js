// Lezione di esempio (onboarding dei tester) — buildSampleStudy().
//
// Estrae la funzione reale da public/index.html (stessa tecnica di
// tests/localStorageGuards.test.js) e verifica che il contenuto scritto a
// mano abbia la stessa forma dei dati prodotti da /api/generate, così che
// ogni schermata dell'app (flashcard, quiz, glossario, timeline, mappa) lo
// renderizzi senza sorprese. Nessuna rete, nessun costo.

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

const sandbox = { console: { log() {}, error() {} } };
vm.createContext(sandbox);
vm.runInContext(`${extractFunction('buildSampleStudy')}\n${extractFunction('parseMindmapText')}`, sandbox);

// Gli oggetti creati nel contesto vm hanno un altro "realm": li porto nel
// nostro con JSON così gli assert su struttura/prototipi sono affidabili.
const sample = JSON.parse(JSON.stringify(sandbox.buildSampleStudy()));
const data = sample.data;

test('esempio: metadati della lezione e marcatura come esempio', () => {
  assert.equal(typeof sample.id, 'number', 'id numerico: la Libreria ordina con b.id - a.id');
  assert.ok(sample.id < 1e6, 'id piccolo, così l\'esempio finisce dopo le lezioni vere (id = Date.now())');
  assert.equal(sample.isSample, true);
  assert.ok(sample.name && sample.subject && sample.date && sample.fileType);
  assert.ok(sample.fullText.length > 100, 'fullText serve alla chat come contesto');
});

test('esempio: riassunti, punti salienti, glossario, timeline', () => {
  assert.ok(data.summary_short.length > 50);
  assert.ok(data.summary_long.length > data.summary_short.length);
  assert.equal(data.highlights.length, 5, 'come richiesto dal prompt di /api/generate');
  assert.ok(data.glossary.length >= 8);
  for (const g of data.glossary) {
    assert.ok(g.term && g.definition, `voce di glossario incompleta: ${JSON.stringify(g)}`);
  }
  assert.equal(new Set(data.glossary.map(g => g.term)).size, data.glossary.length, 'termini duplicati');
  assert.equal(data.mind_map.length, 8);
  assert.ok(data.timeline.length >= 4);
  for (const t of data.timeline) {
    assert.ok(t.date && t.event, `evento di timeline incompleto: ${JSON.stringify(t)}`);
  }
});

test('esempio: flashcard valide e senza domande duplicate', () => {
  assert.ok(data.flashcards.length >= 8);
  for (const c of data.flashcards) {
    assert.ok(typeof c.q === 'string' && c.q.trim() && typeof c.a === 'string' && c.a.trim());
  }
  assert.equal(new Set(data.flashcards.map(c => c.q)).size, data.flashcards.length, 'domande duplicate');
});

test('esempio: ogni domanda del quiz ha 4 opzioni distinte e un indice corretto valido', () => {
  assert.ok(data.quiz.length >= 6);
  for (const q of data.quiz) {
    assert.ok(q.q && Array.isArray(q.options), `quiz malformato: ${JSON.stringify(q)}`);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4, `opzioni duplicate in "${q.q}"`);
    assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4, `indice corretto non valido in "${q.q}"`);
  }
});

test('esempio: la mappa mentale è letta dal parser reale, senza ricadere nel fallback inventato', () => {
  const map = JSON.parse(JSON.stringify(sandbox.parseMindmapText(data.mindmapDetailed)));

  assert.equal(map.title, 'LA FOTOSINTESI');
  assert.notEqual(map.title, 'Integrazione Scolastica', 'titolo di default hardcoded del parser');
  assert.ok(map.children.length >= 4, `rami trovati: ${map.children.length}`);

  const branchTexts = map.children.map(c => c.text);
  for (const fake of ['Evoluzione Storica', 'Normativa', 'Principi Educativi', 'Applicazioni Pratiche']) {
    assert.ok(!branchTexts.includes(fake), `ramo del fallback inventato: "${fake}"`);
  }
  assert.ok(map.children.every(c => c.children.length >= 2), 'ogni ramo deve avere dei sotto-concetti');
});

test('esempio: rispetta i limiti sugli input della Slice 1 (orchestrator.js), così la chat e i pulsanti AI non lo troncano', () => {
  assert.ok(data.summary_short.length <= 1000);
  assert.ok(data.summary_long.length <= 3000);
  assert.ok(sample.fullText.length <= 8000);
  assert.ok(data.highlights.every(h => h.length <= 500));
  assert.ok(data.flashcards.every(c => c.q.length <= 1000 && c.a.length <= 1000));
  assert.ok(data.glossary.every(g => g.term.length <= 500 && g.definition.length <= 500));
});

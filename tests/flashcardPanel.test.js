// Flashcard: le funzioni AI (Spiega semplice, Esempio, Domanda da saggio) sono
// in un pannello sempre visibile sotto la carta, non più sul retro.
//
// Bug corretto lungo la strada: il testo della domanda veniva scritto dentro
// gli attributi onclick. Una domanda con l'apostrofo ("Cos'è l'ossigeno?")
// rompeva la sintassi e i tre pulsanti non facevano nulla; con le virgolette
// si poteva anche iniettare codice. Ora negli attributi non c'è più testo
// della carta.
//
// Esegue le funzioni reali di public/index.html in un contesto vm con DOM e
// rete finti. Nessuna chiamata AI, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'index.html'), 'utf8');

function extractFunction(name) {
  let start = html.indexOf(`function ${name}(`);
  assert.ok(start !== -1, `Funzione "${name}" non trovata`);
  if (html.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  let depth = 0;
  let i = html.indexOf('{', start);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function makeEnv({ cards, index = 0, fetchImpl, notes = {} } = {}) {
  const study = { id: 's1', name: 'Lezione', subject: 'Biologia', data: { summary_short: 'sintesi', flashcards: cards } };
  const out = { html: '', alerts: [], fetches: [], saved: 0, storage: {}, scrolled: 0 };
  const noteField = { value: '' };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    escapeHTML,
    getCurrentStudy: () => study,
    appState: { flashcardMode: 'all', currentFlashcardFiltered: index, notes },
    flashcardStats: {},
    localStorage: { setItem: (k, v) => { out.storage[k] = v; } },
    document: {
      getElementById: (id) => {
        if (id === 'contentArea') return { set innerHTML(v) { out.html = v; }, get innerHTML() { return out.html; } };
        if (id === 'flashcardNote') return noteField;
        if (id === 'aiResults') return { scrollIntoView() { out.scrolled++; } };
        return null;
      }
    },
    alert: (m) => out.alerts.push(m),
    setTimeout: (fn) => fn(),
    saveStudies: () => { out.saved++; },
    buildFetchError: async () => new Error('errore di rete'),
    fetch: async (url, opts) => {
      out.fetches.push({ url, body: JSON.parse(opts.body) });
      return fetchImpl ? fetchImpl() : { ok: true, json: async () => ({ data: { answer: 'Risposta generata' } }) };
    }
  };
  vm.createContext(ctx);
  vm.runInContext(
    ['filterFlashcardsByMode', 'updateFlashcardStats', 'getCurrentFlashcardId', 'saveFlashcardNote',
      'getCurrentFlashcardOrWarn', 'scrollToAiResults', 'renderFlashcardsAdvanced',
      'generateExplanation', 'generateExample', 'generateEssay'].map(extractFunction).join('\n'),
    ctx
  );
  return { ctx, study, out, noteField };
}

const TRICKY_Q = `Cos'è l'ossigeno? "<b>x</b>"`;
const cards = [
  { q: 'Domanda semplice', a: 'Risposta' },
  { q: TRICKY_Q, a: `L'elemento "O" & <i>basta</i>` }
];

test('il pannello AI sta sotto la carta (fuori dal retro) e i tre pulsanti sono sempre visibili', () => {
  const { ctx, out } = makeEnv({ cards });
  ctx.renderFlashcardsAdvanced();

  const back = out.html.slice(out.html.indexOf('class="flashcard-back"'), out.html.indexOf('class="controls"'));
  assert.ok(!/ai-btn|generateExplanation|generateExample|generateEssay/.test(back), 'i pulsanti non devono stare sul retro della carta');

  assert.match(out.html, /class="ai-panel"/);
  assert.match(out.html, /onclick="generateExplanation\(event\)"[^>]*>💡 Spiega semplice/);
  assert.match(out.html, /onclick="generateExample\(event\)"[^>]*>📚 Esempio/);
  assert.match(out.html, /onclick="generateEssay\(event\)"[^>]*>✏️ Domanda da saggio/);
  assert.ok(out.html.indexOf('class="ai-panel"') > out.html.indexOf('class="flashcard '), 'il pannello deve venire dopo la carta');
});

test('apostrofi, virgolette e HTML nella carta non finiscono negli attributi onclick né rompono la pagina', () => {
  const { ctx, out } = makeEnv({ cards, index: 1 });
  ctx.renderFlashcardsAdvanced();

  const handlers = [...out.html.matchAll(/onclick="([^"]*)"/g)].map(m => m[1]);
  assert.ok(handlers.length > 5);
  for (const h of handlers) {
    assert.ok(!h.includes('ossigeno'), `testo della carta in un attributo onclick: ${h}`);
    // ogni gestore deve essere sintatticamente valido
    assert.doesNotThrow(() => new vm.Script(h), `gestore non valido: ${h}`);
  }
  assert.ok(!out.html.includes('<b>x</b>'), 'HTML della domanda non sanificato');
  assert.ok(out.html.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(!out.html.includes('<i>basta</i>'), 'HTML della risposta non sanificato');
});

test('i risultati già generati compaiono nel pannello (con escape) e il relativo pulsante sparisce', () => {
  const withResults = [{ q: 'D', a: 'R', explanation: 'Spiega <script>alert(1)</script>', example: 'Un esempio' }];
  const { ctx, out } = makeEnv({ cards: withResults });
  ctx.renderFlashcardsAdvanced();

  assert.ok(out.html.includes('Spiega &lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!out.html.includes('<script>alert(1)'));
  assert.match(out.html, /Un esempio/);
  assert.ok(!/generateExplanation/.test(out.html), 'spiegazione già presente: niente pulsante');
  assert.ok(!/generateExample/.test(out.html));
  assert.match(out.html, /generateEssay/, 'il saggio manca ancora: pulsante presente');
});

test('con tutto già generato non compare l\'avviso "usa l\'AI"', () => {
  const full = [{ q: 'D', a: 'R', explanation: 'a', example: 'b', essay: 'c' }];
  const { ctx, out } = makeEnv({ cards: full });
  ctx.renderFlashcardsAdvanced();
  assert.ok(!/ai-hint/.test(out.html));
  const partial = makeEnv({ cards });
  partial.ctx.renderFlashcardsAdvanced();
  assert.match(partial.out.html, /ai-hint/);
});

test('generare una spiegazione su una carta con apostrofo: chiamata corretta, salvata, nessun giro della carta', async () => {
  const { ctx, study, out } = makeEnv({ cards, index: 1 });
  const btn = { disabled: false, textContent: '' };
  await ctx.generateExplanation({ target: btn });

  assert.equal(out.fetches.length, 1);
  assert.equal(out.fetches[0].url, '/api/v1/ai/ask');
  assert.equal(out.fetches[0].body.task, 'flashcardExplain');
  assert.equal(out.fetches[0].body.context.card.q, TRICKY_Q, 'la domanda deve arrivare intatta');
  assert.equal(study.data.flashcards[1].explanation, 'Risposta generata');
  assert.equal(out.saved, 1);
  assert.equal(out.scrolled, 1, 'deve portare in vista i risultati');
  assert.ok(!/flipped/.test(out.html), 'la carta non deve girarsi');
  assert.match(out.html, /Risposta generata/);
});

test('esempio e saggio: task giusti e risultato salvato sulla carta corretta', async () => {
  const { ctx, study, out } = makeEnv({ cards, index: 0 });
  await ctx.generateExample({ target: { disabled: false, textContent: '' } });
  await ctx.generateEssay({ target: { disabled: false, textContent: '' } });

  assert.deepEqual(out.fetches.map(f => f.body.task), ['flashcardExample', 'flashcardEssay']);
  assert.equal(study.data.flashcards[0].example, 'Risposta generata');
  assert.equal(study.data.flashcards[0].essay, 'Risposta generata');
  assert.equal(study.data.flashcards[1].example, undefined, 'l\'altra carta non deve cambiare');
});

test('se la richiesta fallisce: avviso chiaro, nulla salvato, pulsante riattivato', async () => {
  const { ctx, study, out } = makeEnv({ cards, fetchImpl: () => ({ ok: false }) });
  const btn = { disabled: false, textContent: '' };
  await ctx.generateExplanation({ target: btn });

  assert.equal(study.data.flashcards[0].explanation, undefined);
  assert.equal(out.saved, 0);
  assert.equal(btn.disabled, false);
  assert.equal(btn.textContent, '💡 Spiega semplice');
  assert.match(out.alerts[0], /Errore: errore di rete/);
});

test('senza flashcard disponibile: avviso, nessuna chiamata di rete', async () => {
  const { ctx, out } = makeEnv({ cards: [] });
  await ctx.generateEssay({ target: { disabled: false, textContent: '' } });
  assert.equal(out.fetches.length, 0);
  assert.equal(out.alerts.length, 1);
});

test('salva nota: l\'identificativo della carta viene dallo stato, non dall\'HTML', () => {
  const { ctx, out, noteField } = makeEnv({ cards, index: 1 });
  noteField.value = 'la mia nota';
  ctx.saveFlashcardNote();

  assert.deepEqual(JSON.parse(out.storage.flashcardNotes), { [`s1_${TRICKY_Q}`]: 'la mia nota' });
  assert.match(out.alerts[0], /Nota salvata/);
});

test('la nota già salvata si rilegge nel campo con escape (</textarea> non rompe la pagina)', () => {
  const evil = { [`s1_Domanda semplice`]: '</textarea><img src=x onerror=alert(1)>' };
  const { ctx, out } = makeEnv({ cards, notes: evil });
  ctx.renderFlashcardsAdvanced();
  assert.ok(!out.html.includes('</textarea><img'));
  assert.ok(out.html.includes('&lt;/textarea&gt;'));
});

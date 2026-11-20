// Onestà dei contenuti generati: se la risposta dell'AI non si riesce a leggere,
// l'app lo dice invece di mostrare contenuti inventati come se fossero veri.
//
// Prima:
// - mappa mentale: se il testo non era leggibile, il parser disegnava un titolo
//   fisso e quattro rami fissi (di un argomento specifico) per QUALSIASI lezione;
// - analisi dei tre pilastri: una risposta senza i pilastri veniva salvata come
//   "riuscita", con titoli inventati e contenuti vuoti.
//
// Esegue le funzioni reali di public/index.html in un contesto vm con DOM e rete
// finti. Nessuna chiamata AI, nessun costo.

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
  // se è dichiarata "async function", la parola async fa parte della funzione
  if (html.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  let depth = 0;
  let i = html.indexOf('{', start);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

const plain = (v) => JSON.parse(JSON.stringify(v));
const FAKE_TEXTS = ['Integrazione Scolastica', 'Evoluzione Storica', 'Principi Educativi', 'Applicazioni Pratiche',
  'Definizione Base', 'Collegamenti Concettuali'];

// ---------------------------------------------------------------- parser mappa
const parserCtx = { console: { log() {}, warn() {}, error() {} } };
vm.createContext(parserCtx);
vm.runInContext(extractFunction('parseMindmapText'), parserCtx);
const parse = (t, title) => plain(parserCtx.parseMindmapText(t, title));

const VALID_MAP = [
  '━━━━━━━━━━━━━━━━━━━━', '   LA FOTOSINTESI', '━━━━━━━━━━━━━━━━━━━━', '',
  '├─ Reagenti', '│  ├─ Luce', '│  └─ Acqua', '│',
  '├─ Prodotti', '│  ├─ Glucosio', '│  └─ Ossigeno', '│',
  '└─ Collegamenti:', '   • Collega Luce con Reagenti'
].join('\n');

test('nessun testo inventato rimane nel codice (mappa e analisi)', () => {
  for (const fake of FAKE_TEXTS) {
    assert.ok(!html.includes(fake), `testo inventato ancora presente nel codice: "${fake}"`);
  }
});

test('mappa: testo che non è un albero -> null, non una mappa inventata', () => {
  assert.equal(parse('Mi dispiace, non posso creare una mappa mentale per questo contenuto.', 'Storia'), null);
  assert.equal(parse('', 'Storia'), null);
  assert.equal(parse('```\n```', 'Storia'), null);
});

test('mappa: un titolo senza rami non basta per avere una mappa', () => {
  assert.equal(parse('━━━━━━━━\n   TITOLO SOLO\n━━━━━━━━', 'Qualsiasi'), null);
});

test('mappa: albero valido -> titolo e rami reali, senza rami estranei', () => {
  const map = parse(VALID_MAP, 'Nome lezione');
  assert.equal(map.title, 'LA FOTOSINTESI');
  assert.deepEqual(map.children.map(c => c.text), ['Reagenti', 'Prodotti']);
  assert.deepEqual(map.children[0].children, ['Luce', 'Acqua']);
});

test('mappa: se manca il titolo si usa il nome VERO della lezione, mai uno fisso', () => {
  const noTitle = '├─ Ramo uno\n│  ├─ Dettaglio A\n├─ Ramo due\n│  ├─ Dettaglio B';
  const map = parse(noTitle, 'La mia lezione');
  assert.equal(map.title, 'La mia lezione');
  assert.deepEqual(map.children.map(c => c.text), ['Ramo uno', 'Ramo due']);
  assert.equal(parse(noTitle), null, 'senza titolo né nome lezione non si inventa un titolo');
});

// ------------------------------------------------------- schermata mappa mentale
function renderMindMapEnv(mindmapText) {
  const written = { html: '' };
  const created = [];
  const timers = [];
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    getCurrentStudy: () => ({ name: 'Lezione di prova', data: { mindmapDetailed: mindmapText } }),
    escapeHTML: (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    document: {
      getElementById: (id) => (id === 'contentArea'
        ? { set innerHTML(v) { written.html = v; }, get innerHTML() { return written.html; } }
        : { innerHTML: '' })
    },
    setTimeout: (fn) => { timers.push(fn); },
    ProfessionalMindMap: class { constructor(id, data) { created.push({ id, data: plain(data) }); } },
    window: {}
  };
  vm.createContext(ctx);
  vm.runInContext(`${extractFunction('parseMindmapText')}\n${extractFunction('renderMindMap')}`, ctx);
  ctx.renderMindMap();
  timers.forEach(fn => fn());
  return { html: written.html, created };
}

test('schermata mappa: testo non leggibile -> messaggio chiaro, testo generato mostrato (con escape), nessuna mappa disegnata', () => {
  const raw = 'Non posso farlo. <script>alert(1)</script>';
  const { html: page, created } = renderMindMapEnv(raw);

  assert.match(page, /Non siamo riusciti a ricavare la mappa/);
  assert.match(page, /Rigenera Mappa/);
  assert.match(page, /Copia come Testo/);
  assert.ok(page.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'il testo generato deve comparire con escape');
  assert.ok(!page.includes('<script>alert(1)'), 'nessun HTML non sanificato');
  assert.equal(created.length, 0, 'non deve disegnare nessuna mappa');
  for (const fake of FAKE_TEXTS) assert.ok(!page.includes(fake), `testo inventato nella pagina: ${fake}`);
});

test('schermata mappa: testo valido -> contenitore e mappa disegnata coi dati veri', () => {
  const { html: page, created } = renderMindMapEnv(VALID_MAP);

  assert.match(page, /id="mindmapCanvas"/);
  assert.ok(!/Non siamo riusciti/.test(page));
  assert.equal(created.length, 1);
  assert.equal(created[0].data.title, 'LA FOTOSINTESI');
  assert.equal(created[0].data.children.length, 2);
});

// ------------------------------------------------------- analisi dei tre pilastri
async function runConceptAnalysis(answerText) {
  const study = { name: 'Lezione', subject: 'Storia', data: { summary_long: 'x', highlights: [] } };
  const state = { saved: 0, rendered: 0, errorBox: null };
  const contentArea = { innerHTML: '' };
  const ctx = {
    console: { log() {}, warn() {}, error() {} },
    getCurrentStudy: () => study,
    fetch: async () => ({ ok: true, json: async () => ({ data: { answer: answerText } }) }),
    buildFetchError: async () => new Error('errore di rete'),
    saveStudies: () => { state.saved++; },
    renderConceptAnalysis: () => { state.rendered++; },
    renderFetchErrorBox: (error) => { state.errorBox = error.message; return `<div class="error-message">${error.message}</div>`; },
    document: { getElementById: () => contentArea }
  };
  vm.createContext(ctx);
  vm.runInContext(extractFunction('generateConceptAnalysis'), ctx);
  await ctx.generateConceptAnalysis();
  return { study, state, contentArea };
}

test('analisi: risposta senza i pilastri -> errore chiaro, nulla salvato', async () => {
  const { study, state, contentArea } = await runConceptAnalysis('Certo! Ecco una riflessione generica sull\'argomento, senza struttura.');

  assert.equal(study.data.conceptAnalysis, undefined, 'non deve salvare un\'analisi finta');
  assert.equal(state.saved, 0);
  assert.equal(state.rendered, 0);
  assert.match(state.errorBox, /non ha il formato previsto/);
  assert.match(contentArea.innerHTML, /error-message/);
});

test('analisi: risposta completa -> salvata con i titoli veri', async () => {
  const text = 'PILASTRO 1: Le cause\nContenuto uno\n\nPILASTRO 2: Gli eventi\nContenuto due\n\nPILASTRO 3: Le conseguenze\nContenuto tre\n\nCOLLEGAMENTI:\nSi legano così.';
  const { study, state } = await runConceptAnalysis(text);

  assert.equal(state.saved, 1);
  const a = plain(study.data.conceptAnalysis);
  assert.deepEqual([a.pillar1_title, a.pillar2_title, a.pillar3_title], ['Le cause', 'Gli eventi', 'Le conseguenze']);
  assert.equal(a.connections, 'Si legano così.');
});

test('analisi: se manca qualche pilastro, quello mancante resta vuoto (nessun titolo inventato)', async () => {
  const { study, state } = await runConceptAnalysis('PILASTRO 1: Solo il primo\nContenuto uno\n');

  assert.equal(state.saved, 1);
  const a = plain(study.data.conceptAnalysis);
  assert.equal(a.pillar1_title, 'Solo il primo');
  assert.equal(a.pillar2_title, '');
  assert.equal(a.pillar3_title, '');
  for (const fake of FAKE_TEXTS) assert.ok(!JSON.stringify(a).includes(fake), `titolo inventato: ${fake}`);
});

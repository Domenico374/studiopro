// Rifinitura del design (novembre 2026): difetti trovati guardando l'app.
//
// - modalità scura: la scheda della lezione restava bianca con testo chiaro
//   (contrasto 1,3:1) perché `background: white !important` vinceva sulla
//   regola della modalità scura;
// - "← Indietro" ha la classe hidden ma una regola !important la annullava;
// - il tasto evidenziato nel menu non seguiva la sezione aperta;
// - su telefono: pulsante "+" fluttuante sopra il piè di pagina e barra in
//   basso con una sola voce.
//
// Controlli statici sul sorgente + esecuzione della funzione reale
// setActiveTab in un contesto vm. Nessuna rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'index.html'), 'utf8');

const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
const overrideStart = css.indexOf('RIFINITURA DEL DESIGN');
assert.ok(overrideStart !== -1, 'blocco di rifinitura non trovato');
const overrides = css.slice(overrideStart);

function extractBlock(startMarker, open = '{', close = '}') {
  const start = html.indexOf(startMarker);
  assert.ok(start !== -1, `"${startMarker}" non trovato`);
  let depth = 0;
  let i = html.indexOf(open, start);
  for (; i < html.length; i++) {
    if (html[i] === open) depth++;
    if (html[i] === close) { depth--; if (depth === 0) break; }
  }
  return html.slice(start, i + 1);
}

// ---------- colori / contrasto (WCAG) ----------
const lum = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map(h => {
    const v = parseInt(h, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const token = (name) => overrides.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))[1];

test('modalità scura: la scheda della lezione non resta bianca (regola con !important che vince)', () => {
  assert.match(overrides, /body\.dark-mode \.study-item\s*\{[^}]*background:\s*#1a1a2e\s*!important/);
});

test('"← Indietro": la classe hidden non è più annullata da una regola !important', () => {
  assert.match(overrides, /\.back-btn\.hidden\s*\{\s*display:\s*none\s*!important/);
});

test('il pulsante "indietro" non è più grigio su blu scuro (sfondo trasparente, testo scuro)', () => {
  assert.match(overrides, /\.back-btn\s*\{[^}]*background:\s*transparent\s*!important[^}]*color:\s*var\(--primary\)\s*!important/);
});

test('lo stato (Nuovo/In corso) non è più posizionato sopra i pulsanti della scheda', () => {
  assert.match(overrides, /\.study-status\s*\{\s*position:\s*static\s*!important/);
});

test('le azioni della scheda sono pulsanti icona con etichetta accessibile, e il titolo non include più l\'etichetta del tipo', () => {
  assert.match(html, /class="icon-btn"[^>]*aria-label="Scarica la lezione in PDF"/);
  assert.match(html, /class="icon-btn icon-btn-danger"[^>]*aria-label="Elimina la lezione"/);
  assert.match(html, /<span class="study-type">\$\{study\.fileType/);
  assert.match(html, /<strong class="study-title">\$\{escapeHTML\(study\.name\)\}<\/strong>/);
});

test('"Carica File" ha un aspetto disabilitato finché non ci sono file', () => {
  assert.match(overrides, /#uploadBtn:disabled:not\(\.loading\)\s*\{[^}]*background:\s*#cbd5e1\s*!important/);
});

test('contrasto dei colori scelti: testo ≥ 4,5:1 (soglia WCAG AA) in modalità chiara e scura', () => {
  const gold = token('gold'), goldSoft = token('gold-soft'), soft = token('text-soft');
  const pairs = [
    ['testo secondario su bianco', soft, '#ffffff'],
    ['oro scuro (BETA, titolo) su bianco', gold, '#ffffff'],
    ['oro chiaro su intestazione scura', goldSoft, '#2a2a3e'],
    ['testo grigio ex-#666 in modalità scura', '#b4b4cc', '#2a2a3e'],
    ['testo grigio ex-#888 in modalità scura', '#a8a8c4', '#2a2a3e'],
    ['testo ex-#333 in modalità scura', '#e5e5ef', '#2a2a3e'],
    ['titolo scheda in modalità scura', '#f1f5f9', '#1a1a2e'],
    ['tagline in modalità scura', '#cbd5e1', '#2a2a3e'],
    ['etichetta tipo su sfondo chiaro', soft, '#f1f5f9'],
    ['etichetta tipo su sfondo scuro', '#cbd5e1', '#2a2a3e'],
    ['formati accettati su sfondo chiaro', '#334155', '#f1f5f9'],
  ];
  for (const [nome, fg, bg] of pairs) {
    const c = contrast(fg, bg);
    assert.ok(c >= 4.5, `${nome}: contrasto ${c.toFixed(2)}:1 (< 4,5)`);
  }
});

// ---------- menu: evidenziazione della sezione aperta ----------
function makeTabsContext() {
  const ids = ['tabLibrary', 'tabSummary', 'tabFlashcards', 'tabQuiz', 'tabMindmap'];
  const buttons = ids.map(id => ({ id, active: false, classList: null }));
  buttons.forEach(b => {
    b.classList = {
      remove: (c) => { if (c === 'active') b.active = false; },
      add: (c) => { if (c === 'active') b.active = true; }
    };
  });
  const sandbox = {
    document: {
      querySelectorAll: () => buttons,
      querySelector: () => buttons[0],
      getElementById: (id) => buttons.find(b => b.id === id) || null
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(
    `const tabIdMap = { summary: 'tabSummary', flashcards: 'tabFlashcards', quiz: 'tabQuiz', mindmap: 'tabMindmap' };\n${extractBlock('function setActiveTab(')}`,
    sandbox
  );
  return { sandbox, buttons, activeIds: () => buttons.filter(b => b.active).map(b => b.id) };
}

test('menu: aprire una sezione evidenzia quel tasto, senza bisogno dell\'evento del click', () => {
  const { sandbox, activeIds } = makeTabsContext();
  sandbox.setActiveTab('flashcards');
  assert.deepEqual(activeIds(), ['tabFlashcards']);
  sandbox.setActiveTab('quiz');
  assert.deepEqual(activeIds(), ['tabQuiz'], 'un solo tasto evidenziato per volta');
});

test('menu: tornare alla libreria evidenzia il primo tasto ("Libreria Studi")', () => {
  const { sandbox, activeIds } = makeTabsContext();
  sandbox.setActiveTab('mindmap');
  sandbox.setActiveTab('library');
  assert.deepEqual(activeIds(), ['tabLibrary']);
});

test('menu: una sezione sconosciuta non lascia due tasti accesi né lancia errori', () => {
  const { sandbox, activeIds } = makeTabsContext();
  sandbox.setActiveTab('summary');
  assert.doesNotThrow(() => sandbox.setActiveTab('sezione-inesistente'));
  assert.deepEqual(activeIds(), []);
});

test('switchTab chiama setActiveTab (non dipende più dall\'evento del click)', () => {
  assert.match(extractBlock('function switchTab('), /setActiveTab\(tab\)/);
});

// ---------- telefono: barra in basso ----------
test('telefono: niente più pulsante "+" fluttuante (copriva il piè di pagina)', () => {
  assert.ok(!/initFAB/.test(html), 'initFAB è ancora nel codice');
  assert.ok(!/\.fab\b/.test(css), 'regole CSS .fab ancora presenti');
});

test('telefono: la barra in basso ha due voci con etichetta (Libreria, Nuovo) e raggiungono funzioni esistenti', () => {
  const nav = extractBlock('function initMobileNav(');
  assert.match(nav, /Libreria<\/span>/);
  assert.match(nav, /Nuovo<\/span>/);
  assert.match(nav, /goToLibrary\(\)/);
  assert.match(nav, /resetApp\(\)/);
  assert.ok(html.includes('function goToLibrary('), 'goToLibrary non definita');
  assert.ok(html.includes('function resetApp('), 'resetApp non definita');
  assert.match(nav, /setAttribute\('aria-label', 'Navigazione principale'\)/);
});

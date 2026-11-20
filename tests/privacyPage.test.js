// Informativa privacy e canale di contatto.
//
// Una pagina privacy che non corrisponde a ciò che l'app fa davvero è peggio di
// nessuna pagina: questi test collegano le affermazioni dell'informativa al
// codice reale (nessun cookie, nessuno strumento di analisi, limite dei
// caratteri inviati all'AI) e verificano che i link dell'app non siano rotti.
// Nessuna rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const privacy = read('public/privacy.html');
const app = read('public/index.html');
const generateApi = read('api/generate.js');

const CONTACT = 'domenico.cocco@gmail.com';

test('la pagina privacy esiste, è in italiano e ha un titolo', () => {
  assert.match(privacy, /<html lang="it">/);
  assert.match(privacy, /<title>Informativa sulla privacy/);
});

test('la pagina privacy riporta il contatto e le sezioni obbligatorie', () => {
  assert.ok(privacy.includes(`mailto:${CONTACT}`), 'contatto mancante');
  for (const section of ['titolare', 'OpenAI', 'Vercel', 'cookie', 'diritti', 'Garante']) {
    assert.ok(new RegExp(section, 'i').test(privacy), `sezione/termine mancante: ${section}`);
  }
});

test('l\'app collega la privacy e il contatto nel piè di pagina', () => {
  assert.ok(app.includes('href="/privacy.html"'), 'link alla privacy mancante in index.html');
  assert.ok(app.includes(`mailto:${CONTACT}`), 'contatto per le segnalazioni mancante in index.html');
  assert.ok(fs.existsSync(path.join(root, 'public', 'privacy.html')), 'il link punta a un file che non esiste');
});

test('privacy: "nessun cookie e nessuna analisi" è vero per il codice dell\'app', () => {
  assert.ok(!app.includes('document.cookie'), 'l\'app imposta cookie ma l\'informativa dice di no');
  assert.ok(
    !/google-analytics|googletagmanager|gtag\(|plausible|hotjar|mixpanel|sentry/i.test(app),
    'l\'app include uno strumento di analisi ma l\'informativa dice di no'
  );
});

test('privacy: il limite di testo inviato all\'AI dichiarato (8.000 battute) è quello reale', () => {
  assert.ok(privacy.includes('8.000'), 'l\'informativa deve dichiarare il limite');
  assert.match(generateApi, /substring\(0,\s*8000\)/, 'il limite reale in api/generate.js è cambiato: aggiorna l\'informativa');
});

test('privacy: le librerie esterne dichiarate sono le uniche caricate da terzi', () => {
  const hosts = new Set([...app.matchAll(/src="https:\/\/([^\/"]+)/g)].map(m => m[1]));
  const allowed = new Set(['cdn.jsdelivr.net', 'cdnjs.cloudflare.com']);
  for (const h of hosts) {
    assert.ok(allowed.has(h), `host esterno non dichiarato nell'informativa: ${h}`);
  }
  assert.ok(/jsDelivr/i.test(privacy) && /cdnjs/i.test(privacy));
});

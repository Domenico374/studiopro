// Fase 2 (Testing & CI) — docs/PRODUCT_ROADMAP.md.
//
// Verifica che lo script inline di public/index.html sia sintatticamente
// valido, usando il parser reale di V8 (vm.Script) invece di un tokenizer
// scritto a mano. Questo test avrebbe intercettato immediatamente il bug
// storico della '}' mancante in renderMindMap() che ha rotto l'intero
// script inline dal primo commit del file.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '..', 'public', 'index.html');

test('public/index.html: lo script inline ha sintassi JS valida', () => {
  const html = fs.readFileSync(indexPath, 'utf8');

  // Lo script inline è il tag bare "<script>" (senza attributi); i tag
  // "<script src=...>" dei CDN non corrispondono a questo pattern esatto.
  const startTag = '<script>';
  const startIdx = html.indexOf(startTag);
  assert.ok(startIdx !== -1, 'Nessun tag <script> (senza attributi) trovato in index.html');

  const contentStart = startIdx + startTag.length;
  const endIdx = html.indexOf('</script>', contentStart);
  assert.ok(endIdx !== -1, 'Tag <script> aperto ma mai chiuso in index.html');

  const code = html.slice(contentStart, endIdx);

  // Controllo di sanità: se l'estrazione fallisse silenziosamente
  // restituendo una stringa vuota/minuscola, vm.Script() non lo noterebbe.
  assert.ok(
    code.length > 1000,
    `Script inline estratto sospettosamente corto (${code.length} caratteri) — controllare la logica di estrazione`
  );

  try {
    // eslint-disable-next-line no-new
    new vm.Script(code, { filename: 'public/index.html (script inline)' });
  } catch (err) {
    assert.fail(`Sintassi non valida nello script inline di index.html:\n${err.message}`);
  }
});

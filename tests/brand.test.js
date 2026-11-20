// Coerenza del nome: il prodotto si chiama MentoreStudio.
//
// Il nome precedente (StudioPro) non deve riaffiorare nelle pagine, nella
// documentazione o nelle immagini di anteprima. Nota: i percorsi e gli
// indirizzi in minuscolo (repository GitHub, nome della cartella, file
// "studiopro-slice-1-costi.md") restano volutamente com'erano: sono
// identificatori tecnici, non il nome mostrato. Nessuna rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const OLD_NAME = 'StudioPro';
const NAME = 'MentoreStudio';

const visibleFiles = [
  'public/index.html', 'public/privacy.html', 'public/favicon.svg',
  'README.md', 'CONTRIBUTING.md',
  'docs/assets/studiopro-banner.svg',
  ...fs.readdirSync(path.join(root, 'docs')).filter(f => f.endsWith('.md')).map(f => `docs/${f}`)
];

test('il vecchio nome non compare nelle pagine, nella documentazione e nel banner', () => {
  for (const file of visibleFiles) {
    assert.ok(!read(file).includes(OLD_NAME), `"${OLD_NAME}" ancora presente in ${file}`);
  }
});

test('titolo, anteprima di condivisione e intestazione usano il nuovo nome', () => {
  const app = read('public/index.html');
  assert.match(app, new RegExp(`<title>${NAME}`));
  assert.match(app, new RegExp(`og:site_name" content="${NAME}"`));
  assert.match(app, new RegExp(`og:title" content="${NAME}`));
  // il titolo è in due colori (come nel logo): "Mentore" + <span>Studio</span>
  assert.match(app, /class="logo-title">Mentore<span class="logo-gold">Studio<\/span><\/div>/);
  assert.match(app, /class="logo-initials">M</, 'il monogramma deve essere la M');
  assert.match(read('public/privacy.html'), new RegExp(`<title>Informativa sulla privacy — ${NAME}`));
});

test('l\'immagine di anteprima (og:image) esiste, è un PNG leggero e non è il vecchio logo col nome scritto dentro', () => {
  const app = read('public/index.html');
  const m = app.match(/og:image" content="https:\/\/[^\/]+\/([^"]+)"/);
  assert.ok(m, 'og:image mancante');

  const file = path.join(root, 'public', m[1]);
  assert.ok(fs.existsSync(file), `og:image punta a un file che non esiste: ${m[1]}`);
  assert.ok(!/studiopro/i.test(m[1]), 'og:image usa ancora il vecchio logo');

  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'non è un PNG');
  assert.ok(bytes.length < 300 * 1024, `immagine troppo pesante per un'anteprima: ${Math.round(bytes.length / 1024)} KB`);

  // dimensioni dichiarate = dimensioni reali (le legge dall'intestazione IHDR del PNG)
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert.match(app, new RegExp(`og:image:width" content="${width}"`));
  assert.match(app, new RegExp(`og:image:height" content="${height}"`));
});

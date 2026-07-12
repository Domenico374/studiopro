// Fase 2 (Testing & CI) — smoke test per POST /api/generate.
// Stesso approccio degli altri due: handler chiamato direttamente, solo
// percorsi che rispondono prima di una chiamata OpenAI reale.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMockReq, createMockRes } from '../helpers/http-mocks.js';

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-not-a-real-key';

const { default: generateHandler } = await import('../../api/generate.js');

test('OPTIONS -> 200 (preflight CORS)', async () => {
  const req = createMockReq({ method: 'OPTIONS', ip: 'generate-ip-1' });
  const res = createMockRes();
  await generateHandler(req, res);
  assert.equal(res.statusCode, 200);
});

test('GET -> 405', async () => {
  const req = createMockReq({ method: 'GET', ip: 'generate-ip-2' });
  const res = createMockRes();
  await generateHandler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.error, 'Metodo non consentito');
});

test('CORS: Access-Control-Allow-Origin ristretto al dominio dell\'app (Slice 1, punto 3)', async () => {
  const req = createMockReq({ method: 'OPTIONS', ip: 'generate-ip-cors' });
  const res = createMockRes();
  await generateHandler(req, res);
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://mentorestudio.vercel.app');
});

test('Slice 1: body oltre 100KB -> 413, rifiutato prima del controllo API key', async () => {
  const req = createMockReq({
    method: 'POST',
    body: { text: 'x'.repeat(150000) },
    ip: 'generate-ip-body-too-large',
  });
  const res = createMockRes();
  await generateHandler(req, res);
  assert.equal(res.statusCode, 413);
  assert.equal(res.body.error, 'Richiesta troppo grande');
});

test('OPENAI_API_KEY assente -> 500 (controllato prima del rate limit)', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const req = createMockReq({ method: 'POST', body: { text: 'x'.repeat(20) }, ip: 'generate-ip-3' });
  const res = createMockRes();
  await generateHandler(req, res);

  process.env.OPENAI_API_KEY = original;

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'OPENAI_API_KEY non configurata');
});

test('POST con "text" troppo corto -> 400', async () => {
  const req = createMockReq({ method: 'POST', body: { text: 'corto' }, ip: 'generate-ip-4' });
  const res = createMockRes();
  await generateHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Testo PDF vuoto o troppo breve');
});

test('rate limit: oltre il limite orario risponde 429', async () => {
  const ip = 'generate-ip-ratelimit';
  const limit = Number(process.env.RATE_LIMIT_GENERATE_PER_HOUR) || 15;

  let lastRes;
  for (let i = 0; i < limit + 1; i++) {
    const req = createMockReq({ method: 'POST', body: {}, ip });
    lastRes = createMockRes();
    await generateHandler(req, lastRes);
  }

  assert.equal(lastRes.statusCode, 429);
  assert.equal(lastRes.body.success, false);
  assert.equal(lastRes.body.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(lastRes.headers['Retry-After'], 'header Retry-After mancante sulla risposta 429');
});

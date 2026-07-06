// Fase 2 (Testing & CI) — smoke test per POST /api/v1/ai/ask.
//
// Chiama l'handler direttamente (nessun server, nessuna rete): copre solo i
// percorsi "veloci" che rispondono prima di una eventuale chiamata OpenAI
// reale, così i test girano ad ogni push a costo zero. Ogni test usa un IP
// finto diverso per non condividere il contatore del rate limiter.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMockReq, createMockRes } from '../helpers/http-mocks.js';

// Presente ma non valida: basta a superare il check "la chiave esiste" senza
// mai arrivare a una vera chiamata OpenAI in questi test.
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-not-a-real-key';

const { default: askHandler } = await import('../../api/v1/ai/ask.js');

test('OPTIONS -> 200 (preflight CORS)', async () => {
  const req = createMockReq({ method: 'OPTIONS', ip: 'ask-ip-1' });
  const res = createMockRes();
  await askHandler(req, res);
  assert.equal(res.statusCode, 200);
});

test('GET -> 405 METHOD_NOT_ALLOWED', async () => {
  const req = createMockReq({ method: 'GET', ip: 'ask-ip-2' });
  const res = createMockRes();
  await askHandler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'METHOD_NOT_ALLOWED');
});

test('POST senza "message" -> 400 MISSING_MESSAGE', async () => {
  const req = createMockReq({ method: 'POST', body: {}, ip: 'ask-ip-3' });
  const res = createMockRes();
  await askHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'MISSING_MESSAGE');
});

test('OPENAI_API_KEY assente -> 500 CONFIG_MISSING', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const req = createMockReq({ method: 'POST', body: { message: 'ciao' }, ip: 'ask-ip-4' });
  const res = createMockRes();
  await askHandler(req, res);

  process.env.OPENAI_API_KEY = original;

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error.code, 'CONFIG_MISSING');
});

test('rate limit: oltre il limite orario risponde 429 con Retry-After', async () => {
  const ip = 'ask-ip-ratelimit';
  const limit = Number(process.env.RATE_LIMIT_AI_ASK_PER_HOUR) || 40;

  let lastRes;
  for (let i = 0; i < limit + 1; i++) {
    // Body vuoto: fallisce la validazione (400) finché il rate limiter non
    // scatta prima ancora di controllare il body — stesso identico
    // meccanismo verificato manualmente con curl durante il lavoro di
    // rate limiting.
    const req = createMockReq({ method: 'POST', body: {}, ip });
    lastRes = createMockRes();
    await askHandler(req, lastRes);
  }

  assert.equal(lastRes.statusCode, 429);
  assert.equal(lastRes.body.success, false);
  assert.equal(lastRes.body.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(lastRes.headers['Retry-After'], 'header Retry-After mancante sulla risposta 429');
});

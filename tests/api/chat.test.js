// Fase 2 (Testing & CI) — smoke test per POST /api/chat (endpoint legacy).
// Stesso approccio di tests/api/ask.test.js: handler chiamato direttamente,
// solo percorsi che rispondono prima di una chiamata OpenAI reale.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMockReq, createMockRes } from '../helpers/http-mocks.js';

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-not-a-real-key';

const { default: chatHandler } = await import('../../api/chat.js');

test('GET -> 405', async () => {
  const req = createMockReq({ method: 'GET', ip: 'chat-ip-1' });
  const res = createMockRes();
  await chatHandler(req, res);
  assert.equal(res.statusCode, 405);
  assert.equal(res.body.error, 'Metodo non consentito');
});

test('POST senza "message" -> 400', async () => {
  const req = createMockReq({ method: 'POST', body: {}, ip: 'chat-ip-2' });
  const res = createMockRes();
  await chatHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Messaggio mancante');
});

test('POST con message non stringa -> 400', async () => {
  const req = createMockReq({ method: 'POST', body: { message: 123 }, ip: 'chat-ip-3' });
  const res = createMockRes();
  await chatHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Tipo di dato non valido');
});

test('POST con messaggio troppo lungo (>2000 caratteri) -> 400', async () => {
  const req = createMockReq({
    method: 'POST',
    body: { message: 'a'.repeat(2001) },
    ip: 'chat-ip-4',
  });
  const res = createMockRes();
  await chatHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Messaggio troppo lungo');
});

test('POST con conversationHistory non-array -> 400', async () => {
  const req = createMockReq({
    method: 'POST',
    body: { message: 'ciao', conversationHistory: 'non-array' },
    ip: 'chat-ip-5',
  });
  const res = createMockRes();
  await chatHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Storico non valido');
});

test('OPENAI_API_KEY assente -> 500 (con messaggio valido)', async () => {
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const req = createMockReq({ method: 'POST', body: { message: 'ciao' }, ip: 'chat-ip-6' });
  const res = createMockRes();
  await chatHandler(req, res);

  process.env.OPENAI_API_KEY = original;

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.error, 'Configurazione mancante');
});

test('rate limit: oltre il limite orario risponde 429', async () => {
  const ip = 'chat-ip-ratelimit';
  const limit = Number(process.env.RATE_LIMIT_CHAT_PER_HOUR) || 20;

  let lastRes;
  for (let i = 0; i < limit + 1; i++) {
    const req = createMockReq({ method: 'POST', body: {}, ip });
    lastRes = createMockRes();
    await chatHandler(req, lastRes);
  }

  assert.equal(lastRes.statusCode, 429);
  assert.equal(lastRes.body.success, false);
  assert.equal(lastRes.body.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(lastRes.headers['Retry-After'], 'header Retry-After mancante sulla risposta 429');
});

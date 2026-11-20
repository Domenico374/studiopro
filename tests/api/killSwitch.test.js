// Interruttore di emergenza AI_DISABLED — requestGuards.isAiDisabled().
//
// Con AI_DISABLED=true tutti e tre gli endpoint che chiamano OpenAI devono
// rispondere 503 PRIMA di qualunque altra cosa: niente rate limit consumato,
// niente chiamata AI. Handler chiamati direttamente, nessuna rete.

import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createMockReq, createMockRes } from '../helpers/http-mocks.js';

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-not-a-real-key';

const { default: askHandler } = await import('../../api/v1/ai/ask.js');
const { default: chatHandler } = await import('../../api/chat.js');
const { default: generateHandler } = await import('../../api/generate.js');

afterEach(() => { delete process.env.AI_DISABLED; });

// Un body valido: senza l'interruttore arriverebbe fino a OpenAI.
const validBodies = {
  ask: { message: 'ciao' },
  chat: { message: 'ciao' },
  generate: { text: 'x'.repeat(200) }
};

test('AI_DISABLED=true: /api/v1/ai/ask risponde 503 AI_DISABLED con il formato standard', async () => {
  process.env.AI_DISABLED = 'true';
  const res = createMockRes();
  await askHandler(createMockReq({ method: 'POST', body: validBodies.ask, ip: 'kill-ask' }), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'AI_DISABLED');
  assert.equal(res.body.error.status, 503);
  assert.ok(res.body.error.message.includes('sospeso'));
});

test('AI_DISABLED=true: /api/chat risponde 503', async () => {
  process.env.AI_DISABLED = 'true';
  const res = createMockRes();
  await chatHandler(createMockReq({ method: 'POST', body: validBodies.chat, ip: 'kill-chat' }), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'Servizio sospeso');
});

test('AI_DISABLED=true: /api/generate risponde 503', async () => {
  process.env.AI_DISABLED = 'true';
  const res = createMockRes();
  await generateHandler(createMockReq({ method: 'POST', body: validBodies.generate, ip: 'kill-generate' }), res);

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.error, 'Servizio sospeso');
});

test('AI_DISABLED=true non consuma il rate limit: nessun header X-RateLimit sulla risposta', async () => {
  process.env.AI_DISABLED = 'true';
  const res = createMockRes();
  await askHandler(createMockReq({ method: 'POST', body: validBodies.ask, ip: 'kill-nolimit' }), res);

  assert.equal(res.headers['X-RateLimit-Limit'], undefined, 'il rate limiter non deve essere nemmeno interpellato');
});

test('senza AI_DISABLED (o con un valore diverso da "true") gli endpoint funzionano come prima', async () => {
  for (const value of [undefined, 'false', '1', '']) {
    if (value === undefined) delete process.env.AI_DISABLED; else process.env.AI_DISABLED = value;

    // Body vuoto: respinto con 400 dalla validazione, senza mai raggiungere OpenAI.
    const res = createMockRes();
    await askHandler(createMockReq({ method: 'POST', body: {}, ip: `kill-off-${String(value)}` }), res);
    assert.equal(res.statusCode, 400, `AI_DISABLED=${JSON.stringify(value)} non deve bloccare`);
    assert.equal(res.body.error.code, 'MISSING_MESSAGE');
  }
});

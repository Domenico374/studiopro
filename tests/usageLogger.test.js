// Misurazione uso AI — usageLogger.trackAiCall.
// Tutto con chiamate finte: nessuna rete, nessun costo.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { default: usageLogger } = await import('../usageLogger.js');

// Cattura ciò che il logger scrive su console.log durante fn().
async function captureLogs(fn) {
  const lines = [];
  const original = console.log;
  console.log = (...args) => lines.push(args.join(' '));
  try {
    return { result: await fn(), lines };
  } catch (error) {
    return { error, lines };
  } finally {
    console.log = original;
  }
}

test('chiamata riuscita: restituisce la risposta intatta e logga una riga ai_call con i token', async () => {
  const response = { choices: [{ message: { content: 'ciao' } }], usage: { prompt_tokens: 120, completion_tokens: 30, total_tokens: 150 } };

  const { result, lines } = await captureLogs(() =>
    usageLogger.trackAiCall({ source: 'generate', model: 'gpt-4o-mini' }, async () => response)
  );

  assert.equal(result, response, 'la risposta deve passare senza modifiche');
  assert.equal(lines.length, 1, 'esattamente una riga di log per chiamata');

  const entry = JSON.parse(lines[0]);
  assert.equal(entry.type, 'ai_call');
  assert.equal(entry.source, 'generate');
  assert.equal(entry.model, 'gpt-4o-mini');
  assert.equal(entry.status, 'ok');
  assert.equal(entry.promptTokens, 120);
  assert.equal(entry.completionTokens, 30);
  assert.equal(entry.totalTokens, 150);
  assert.equal(typeof entry.durationMs, 'number');
  assert.ok(entry.durationMs >= 0);
  assert.ok(!Number.isNaN(Date.parse(entry.ts)), 'ts deve essere una data valida');
});

test('risposta senza "usage" (es. client finto dei test): nessuna eccezione, token assenti', async () => {
  const { result, lines } = await captureLogs(() =>
    usageLogger.trackAiCall({ source: 'agent:tutor', model: 'gpt-3.5-turbo' }, async () => ({ choices: [] }))
  );

  assert.ok(result);
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.status, 'ok');
  assert.equal('totalTokens' in entry, false);
});

test('chiamata fallita: rilancia lo STESSO errore e logga status error con nome/status/codice', async () => {
  const boom = Object.assign(new Error('Incorrect API key provided: sk-SEGRETO'), {
    name: 'AuthenticationError', status: 401, code: 'invalid_api_key'
  });

  const { error, lines } = await captureLogs(() =>
    usageLogger.trackAiCall({ source: 'agent:quiz', model: 'gpt-3.5-turbo' }, async () => { throw boom; })
  );

  assert.equal(error, boom, 'l\'errore originale deve essere rilanciato identico');
  const entry = JSON.parse(lines[0]);
  assert.equal(entry.status, 'error');
  assert.equal(entry.errorName, 'AuthenticationError');
  assert.equal(entry.errorStatus, 401);
  assert.equal(entry.errorCode, 'invalid_api_key');
  assert.ok(!lines[0].includes('SEGRETO'), 'il messaggio d\'errore (può citare la chiave) non deve finire nel log');
});

test('privacy: il contenuto di risposta non compare mai nel log', async () => {
  const { lines } = await captureLogs(() =>
    usageLogger.trackAiCall({ source: 'generate', model: 'gpt-4o-mini' }, async () => ({
      choices: [{ message: { content: 'TESTO-RISERVATO-DELLO-STUDENTE' } }],
      usage: { total_tokens: 5 }
    }))
  );

  assert.ok(!lines[0].includes('TESTO-RISERVATO'), 'nessun contenuto di risposta nel log');
});

test('se il logging stesso fallisce, la richiesta NON deve fallire', async () => {
  const original = console.log;
  console.log = () => { throw new Error('console rotta'); };
  try {
    const response = { usage: { total_tokens: 1 } };
    const result = await usageLogger.trackAiCall({ source: 'generate', model: 'm' }, async () => response);
    assert.equal(result, response);
  } finally {
    console.log = original;
  }
});

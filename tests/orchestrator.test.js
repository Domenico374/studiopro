// Slice 1 (protezione costi) — vedi studiopro-slice-1-costi.md, punto 1.
//
// Verifica che orchestrator.js tronchi i campi di "context" PRIMA di
// costruire il prompt inviato all'agente, indipendentemente da cosa manda il
// chiamante. Usa un llmClient finto (nessuna rete, nessun costo reale): cattura
// i "messages" passati a chat.completions.create e ne misura la lunghezza.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { default: orchestrator } = await import('../orchestrator.js');

function makeMockClient(responseText) {
  const calls = [];
  return {
    calls,
    chat: {
      completions: {
        create: async (params) => {
          calls.push(params);
          return { choices: [{ message: { content: responseText } }] };
        }
      }
    }
  };
}

test('Slice 1: context.highlights enorme viene troncato prima del prompt (conceptAnalysis)', async () => {
  const client = makeMockClient('PILASTRO 1: x');
  const hugeHighlights = Array.from({ length: 500 }, (_, i) => `punto-${i}-`.repeat(200));

  await orchestrator.ask({
    message: 'analizza',
    agent: 'tutor',
    task: 'conceptAnalysis',
    context: {
      subject: 'Storia',
      name: 'Lezione',
      summary_long: 'y'.repeat(100000),
      highlights: hugeHighlights
    }
  }, client);

  const sentPrompt = client.calls[0].messages[client.calls[0].messages.length - 1].content;
  // 20 voci al massimo, 500 char ciascuna al massimo -> ben sotto la
  // dimensione che avrebbe il context grezzo (500 voci da ~1400 char = 700KB).
  assert.ok(sentPrompt.length < 20000, `prompt troppo lungo: ${sentPrompt.length} caratteri`);
});

test('Slice 1: context.fullText enorme viene troncato a 8000 caratteri prima del prompt', async () => {
  const client = makeMockClient('spiegazione');

  await orchestrator.ask({
    message: 'spiega questo',
    agent: 'tutor',
    task: 'explainHighlight',
    context: {
      subject: 'Storia',
      name: 'Lezione',
      fullText: 'z'.repeat(500000),
      highlight: 'a'.repeat(500000)
    }
  }, client);

  const sentPrompt = client.calls[0].messages[client.calls[0].messages.length - 1].content;
  assert.ok(sentPrompt.length < 20000, `prompt troppo lungo: ${sentPrompt.length} caratteri`);
});

test('Slice 1: card.q/card.a enormi vengono troncati prima del prompt (flashcardExplain)', async () => {
  const client = makeMockClient('spiegazione semplice');

  await orchestrator.ask({
    message: 'spiega',
    agent: 'tutor',
    task: 'flashcardExplain',
    context: { card: { q: 'q'.repeat(500000), a: 'a'.repeat(500000) } }
  }, client);

  const sentPrompt = client.calls[0].messages[client.calls[0].messages.length - 1].content;
  assert.ok(sentPrompt.length < 10000, `prompt troppo lungo: ${sentPrompt.length} caratteri`);
});

test('Slice 1: uso legittimo (campi normali) non viene alterato dal troncamento', async () => {
  const client = makeMockClient('Risposta del tutor');

  await orchestrator.ask({
    message: 'Ciao, spiegami la fotosintesi',
    agent: 'tutor',
    task: 'chat',
    context: {
      subject: 'Scienze',
      name: 'La fotosintesi',
      summary_short: 'La fotosintesi è il processo con cui le piante producono energia dalla luce.',
      highlights: ['clorofilla', 'luce solare', 'anidride carbonica'],
      conversationHistory: []
    }
  }, client);

  const sentPrompt = client.calls[0].messages[client.calls[0].messages.length - 1].content;
  assert.ok(sentPrompt.includes('fotosintesi'), 'il contenuto legittimo deve arrivare intatto nel prompt');
  assert.ok(sentPrompt.includes('clorofilla'), 'i punti chiave legittimi devono arrivare nel prompt');
});

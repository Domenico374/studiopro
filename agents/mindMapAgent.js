// Extracted from public/index.html: generateDetailedMindmap (~4986-5032).
// Builds a detailed, hierarchical ASCII mind map and posts it to the generic
// /api/chat endpoint. There is no dedicated "mind map" system prompt in the
// codebase — this reuses the same generic assistant prompt as api/chat.js.
//
// Note: this is distinct from the flat `mind_map` array (8 concepts) that
// Summary Agent already produces as part of its single bulk call — that flat
// list has no dedicated prompt/logic of its own to extract, since it's just
// one field of Summary Agent's combined JSON output.

import chatCompletion from './shared/chatCompletion.js';

const name = 'Mind Map Agent';

const systemPrompt = 'Sei un assistente utile e cortese.';

// index.html ~4999-5001
function buildPrompt(input) {
  const { study } = input;
  const context = `Materia: ${study.subject}\nLezione: ${study.name}\n\nRiassunto: ${study.data.summary_long}\n\nPunti chiave: ${(study.data.highlights || []).join(', ')}`;
  const prompt = `Crea una mappa mentale TESTUALE dettagliata e gerarchica per questo argomento:\n\n${context}\n\nUsa questa struttura ASCII:\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n   CONCETTO CENTRALE\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n├─ Ramo principale 1\n│  ├─ Sotto-concetto 1.1\n│  ├─ Sotto-concetto 1.2\n│  └─ Sotto-concetto 1.3\n│\n├─ Ramo principale 2\n│  ├─ Sotto-concetto 2.1\n│  │  ├─ Dettaglio 2.1.1\n│  │  └─ Dettaglio 2.1.2\n│  └─ Sotto-concetto 2.2\n│\n├─ Ramo principale 3\n│  ├─ Sotto-concetto 3.1\n│  └─ Sotto-concetto 3.2\n│\n└─ Collegamenti:\n   • Collega concetto 1.1 con 2.1\n   • Collega concetto 2.2 con 3.1\n\nCrea 3-4 rami principali con sotto-concetti dettagliati.`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];
}

// Mirrors the OpenAI call parameters from api/chat.js lines 95-103.
async function run(input, llmClient) {
  const messages = buildPrompt(input);
  return chatCompletion.runChatCompletion(messages, llmClient);
}

export default { name, systemPrompt, buildPrompt, run };

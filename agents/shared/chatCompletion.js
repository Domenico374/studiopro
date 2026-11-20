// Sprint 3 (tech-debt cleanup) — deduplica una funzione run() byte-identica
// che esisteva in agents/tutorAgent.js e agents/mindMapAgent.js (e con gli
// stessi identici parametri anche in agents/quizAgent.js): Tutor, Quiz e Mind
// Map Agent riusano tutti lo stesso "assistente generico" di api/chat.js
// (nessun system prompt/parametri dedicati per agente).

import usageLogger from '../../usageLogger.js';

const MODEL = 'gpt-3.5-turbo';

// "meta.agent" (es. 'tutor') serve solo a etichettare la riga di log di
// usageLogger: non cambia in alcun modo la chiamata a OpenAI.
async function runChatCompletion(messages, llmClient, meta = {}) {
  const response = await usageLogger.trackAiCall(
    { source: `agent:${meta.agent || 'unknown'}`, model: MODEL },
    () => llmClient.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.6
    })
  );

  return response.choices[0].message.content;
}

export default { runChatCompletion };

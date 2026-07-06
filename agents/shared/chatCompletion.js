// Sprint 3 (tech-debt cleanup) — deduplica una funzione run() byte-identica
// che esisteva in agents/tutorAgent.js e agents/mindMapAgent.js (e con gli
// stessi identici parametri anche in agents/quizAgent.js): Tutor, Quiz e Mind
// Map Agent riusano tutti lo stesso "assistente generico" di api/chat.js
// (nessun system prompt/parametri dedicati per agente).

async function runChatCompletion(messages, llmClient) {
  const response = await llmClient.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0.0,
    presence_penalty: 0.6
  });

  return response.choices[0].message.content;
}

export default { runChatCompletion };

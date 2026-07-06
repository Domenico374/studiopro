// Extracted from public/index.html:
// - generateEssayQuestions (~5146-5192): bulk essay/exam question generation
// - generateEssay (~6084-6094): single essay question from one flashcard
// Both build a prompt client-side and post it to the generic /api/chat endpoint.
// There is no dedicated "quiz" system prompt in the codebase — these features
// reuse the same generic assistant prompt as api/chat.js.
//
// Note: the multiple-choice quiz array (study.data.quiz, with options/correct
// index) is NOT produced here — it comes bundled from Summary Agent's single
// bulk call (see agents/summaryAgent.js). See summary-of-ambiguities in the
// refactor report for why it wasn't split out into this agent.

import chatCompletion from './shared/chatCompletion.js';

const name = 'Quiz Agent';

const systemPrompt = 'Sei un assistente utile e cortese.';

function buildPrompt(input) {
  const { task } = input;

  switch (task) {
    // index.html ~5159-5161 (generateEssayQuestions)
    case 'essayQuestions': {
      const { study } = input;
      const context = `Materia: ${study.subject}\nLezione: ${study.name}\n\nRiassunto: ${study.data.summary_short}\n\nPunti chiave: ${(study.data.highlights || []).slice(0, 5).join(', ')}`;
      const prompt = `Genera 5 domande per saggi/esami scritti su questo argomento:\n\n${context}\n\nLe domande devono:\n- Essere aperte e richiedere ragionamento critico\n- Iniziare con "Analizza...", "Discuti...", "Come...", "In che modo...", "Spiega..."\n- Essere adatte per esami universitari o superiori\n- Coprire aspetti diversi dell'argomento\n- Essere formulate in modo chiaro\n\nFormato: una domanda per riga, numerate da 1 a 5.`;
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];
    }

    // index.html ~6094 (generateEssay — single flashcard essay question)
    case 'flashcardEssay': {
      const { card } = input;
      const prompt = `Crea una domanda da saggio/tema d'esame su questo argomento:\n\nDomanda: ${card.q}\nRisposta: ${card.a}\n\nLa domanda deve essere aperta, richiedere ragionamento critico e analisi. Max 2 frasi. Inizia con "Come..." o "In che modo..." o "Analizza..." o "Discuti...".`;
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ];
    }

    default:
      throw new Error(`Quiz Agent: unknown task "${task}"`);
  }
}

// Mirrors the OpenAI call parameters from api/chat.js lines 95-103.
async function run(input, llmClient) {
  const messages = buildPrompt(input);
  const text = await chatCompletion.runChatCompletion(messages, llmClient);

  if (input.task === 'essayQuestions') {
    // Mirrors the response parsing in index.html ~5176-5180.
    return text
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 20);
  }

  return text;
}

export default { name, systemPrompt, buildPrompt, run };

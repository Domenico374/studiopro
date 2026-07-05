// Extracted from:
// - api/chat.js (generic assistant prompt + history handling, lines 55-77)
// - public/index.html: generateHighlightExplanation (~4515-4561), generateGlossaryExample
//   (~4633-4669), generateExplanation (~6004-6042), generateExample (~6044-6082),
//   generateConceptAnalysis (~5287-5347), sendChatMessage (~6503-6570)
// All of the above build a prompt client-side and post it to the same generic
// /api/chat endpoint — grouped here under Tutor Agent because they all serve the
// "explain a concept to the student" mission described in docs/AI_AGENTS.md.

const name = 'Tutor Agent';

const systemPrompt = 'Sei un assistente utile e cortese.';

const MAX_HISTORY_LENGTH = 10;

// Mirrors api/chat.js lines 54-77: builds the OpenAI messages array from the
// system prompt, a trimmed conversation history and the current message.
function buildConversationMessages(message, conversationHistory = []) {
  const messages = [{ role: 'system', content: systemPrompt }];

  const recentHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
  for (const msg of recentHistory) {
    if (msg && msg.role && msg.content) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: 'user', content: message });
  return messages;
}

function buildPrompt(input) {
  const { task } = input;

  switch (task) {
    // index.html ~6548-6562 (sendChatMessage)
    case 'chat': {
      const { study, message, conversationHistory = [] } = input;
      const summaryShort = (study.data.summary_short || '').substring(0, 300);
      const highlightsText = (study.data.highlights || []).slice(0, 3).join('. ').substring(0, 200);
      const contentSnippet = study.fullText ? study.fullText.substring(0, 400) : '';
      const context = `Materia: ${study.subject}\nLezione: ${study.name}\n\nRiassunto: ${summaryShort}\n\nPunti chiave: ${highlightsText}\n\nEstratto: ${contentSnippet}`;
      const fullMessage = `[CONTESTO]\n${context}\n\n[DOMANDA]\n${message}`;
      return buildConversationMessages(fullMessage, conversationHistory);
    }

    // index.html ~4526-4528 (generateHighlightExplanation)
    case 'explainHighlight': {
      const { study, highlight } = input;
      const context = `Materia: ${study.subject}\nLezione: ${study.name}\n\nContenuto: ${study.fullText.substring(0, 1000)}`;
      const prompt = `Fornisci una spiegazione dettagliata e approfondita di questo punto saliente:\n\n"${highlight}"\n\nContesto:\n${context}\n\nLa spiegazione deve essere:\n- Chiara e completa (4-6 frasi)\n- Con esempi concreti se possibile\n- Collegata al contesto della lezione\n- Utile per lo studio e la memorizzazione`;
      return buildConversationMessages(prompt, []);
    }

    // index.html ~4644 (generateGlossaryExample)
    case 'glossaryExample': {
      const { study, glossaryItem } = input;
      const prompt = `Fornisci un esempio pratico e concreto per questo termine:\n\nTermine: ${glossaryItem.term}\nDefinizione: ${glossaryItem.definition}\n\nMateria: ${study.subject}\n\nL'esempio deve essere:\n- Pratico e dalla vita reale\n- Facile da ricordare\n- Collegato alla materia di studio\n- Massimo 3 frasi`;
      return buildConversationMessages(prompt, []);
    }

    // index.html ~6014 (generateExplanation — "Spiega Semplice" flashcard action)
    case 'flashcardExplain': {
      const { card } = input;
      const prompt = `Spiega in modo molto semplice (come a un bambino di 10 anni) questo concetto:\n\nDomanda: ${card.q}\nRisposta: ${card.a}\n\nFornisci una spiegazione chiara, breve (max 3 frasi) e con esempi quotidiani.`;
      return buildConversationMessages(prompt, []);
    }

    // index.html ~6054 (generateExample — "Esempio" flashcard action)
    case 'flashcardExample': {
      const { study, card } = input;
      const prompt = `Fornisci un esempio pratico e concreto per questo concetto:\n\nDomanda: ${card.q}\nRisposta: ${card.a}\n\nDai un esempio reale dalla vita quotidiana o dalla materia ${study.subject}. Max 3 frasi.`;
      return buildConversationMessages(prompt, []);
    }

    // index.html ~5300-5302 (generateConceptAnalysis — "tre pilastri")
    case 'conceptAnalysis': {
      const { study } = input;
      const context = `Materia: ${study.subject}\nLezione: ${study.name}\n\nRiassunto: ${study.data.summary_long}\n\nPunti chiave: ${(study.data.highlights || []).join(', ')}`;
      const prompt = `Analizza in profondità questo argomento identificando i TRE PILASTRI FONDAMENTALI:\n\n${context}\n\nPer ogni pilastro fornisci:\n1. TITOLO del pilastro (3-5 parole)\n2. CONTENUTO del pilastro (4-6 frasi di spiegazione approfondita)\n\nPoi spiega come i tre pilastri si COLLEGANO tra loro.\n\nFormato richiesto:\nPILASTRO 1: [titolo]\n[contenuto]\n\nPILASTRO 2: [titolo]\n[contenuto]\n\nPILASTRO 3: [titolo]\n[contenuto]\n\nCOLLEGAMENTI:\n[spiegazione dei collegamenti]`;
      return buildConversationMessages(prompt, []);
    }

    default:
      throw new Error(`Tutor Agent: unknown task "${task}"`);
  }
}

// Mirrors the OpenAI call parameters from api/chat.js lines 95-103.
async function run(input, llmClient) {
  const messages = buildPrompt(input);

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

export default { name, systemPrompt, buildPrompt, run };

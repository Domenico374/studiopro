// AI Orchestrator — docs/AI_AGENTS.md ("AI Orchestrator" section, ~56-70).
//
// Interprets the student's request, selects one or more agents from agents/,
// runs them (sharing a single context object between them), validates each
// result and builds the final aggregated response. This module is plain
// backend logic with no HTTP/env concerns — it's called from
// api/v1/ai/ask.js, which supplies the llmClient and shapes the HTTP response.

import agents from './agents/index.js';

const AGENT_LABELS = {
  summaryAgent: 'Summary Agent',
  tutorAgent: 'Tutor Agent',
  quizAgent: 'Quiz Agent',
  mindMapAgent: 'Mind Map Agent'
};

// docs/AI_AGENTS.md — Agent Selection Strategy table (~78-86).
// First matching rule wins. "Planner Agent" is named in the docs but has no
// module under agents/ yet, so rules that would select it fall back to
// Tutor Agent instead (see the orchestrator report for this limitation).
const SELECTION_RULES = [
  {
    // "Ho un esame domani" -> Planner + Summary + Tutor + Quiz.
    // Planner Agent doesn't exist yet, so it's dropped from the combination.
    pattern: /esame|interrogazione\s+domani|verifica\s+domani/i,
    agents: ['summaryAgent', 'tutorAgent', 'quizAgent']
  },
  {
    // "Organizza il mio studio" -> Planner Agent (not implemented).
    // Empty list signals "fall through to the default agent" below.
    pattern: /organizza\s+(il\s+)?(mio\s+)?studio|piano\s+di\s+studio|pianifica\s+lo\s+studio/i,
    agents: []
  },
  {
    // "Fammi un riassunto" -> Summary Agent.
    pattern: /riassum|sintetizza|sintesi/i,
    agents: ['summaryAgent']
  },
  {
    // "Interrogami" -> Quiz Agent.
    pattern: /interrog|quiz|verifica|testami/i,
    agents: ['quizAgent']
  },
  {
    // "Crea una mappa concettuale" -> Mind Map Agent.
    pattern: /mappa\s+(concettuale|mentale)/i,
    agents: ['mindMapAgent']
  },
  {
    // "Spiegami un argomento" -> Tutor Agent.
    pattern: /spiega|capire|cosa\s+significa|cos'è|aiutami/i,
    agents: ['tutorAgent']
  }
];

const DEFAULT_AGENTS = ['tutorAgent'];

function selectAgents(message) {
  for (const rule of SELECTION_RULES) {
    if (rule.pattern.test(message)) {
      return rule.agents.length > 0 ? rule.agents : DEFAULT_AGENTS;
    }
  }
  return DEFAULT_AGENTS;
}

// Adapts the orchestrator's generic {message, context} contract into the
// "study" shape agents/tutorAgent.js, quizAgent.js and mindMapAgent.js expect
// (there is no document/database backend yet, so context is whatever the
// caller supplies, filled in with safe defaults).
function buildStudyLikeContext(context) {
  return {
    subject: context.subject || '',
    name: context.name || context.document_id || 'Documento',
    fullText: context.fullText || context.text || '',
    data: {
      summary_short: context.summary_short || '',
      summary_long: context.summary_long || context.summary_short || '',
      highlights: context.highlights || []
    }
  };
}

async function runAgent(agentKey, message, context, llmClient) {
  const study = buildStudyLikeContext(context);

  switch (agentKey) {
    case 'summaryAgent': {
      const text = context.text || context.fullText;
      if (!text) {
        throw new Error('Summary Agent richiede "context.text" (il testo del documento da riassumere).');
      }
      return agents.summaryAgent.run({ text }, llmClient);
    }

    case 'tutorAgent':
      return agents.tutorAgent.run({
        task: 'chat',
        study,
        message,
        conversationHistory: context.conversationHistory || []
      }, llmClient);

    case 'quizAgent':
      return agents.quizAgent.run({ task: 'essayQuestions', study }, llmClient);

    case 'mindMapAgent':
      return agents.mindMapAgent.run({ study }, llmClient);

    default:
      throw new Error(`Orchestrator: agente sconosciuto "${agentKey}".`);
  }
}

// AI Orchestrator responsibility: "validare le risposte" (docs/AI_AGENTS.md ~67).
function validateAgentResult(agentKey, result) {
  const label = AGENT_LABELS[agentKey];

  if (result === null || result === undefined) {
    throw new Error(`${label} ha restituito un risultato vuoto.`);
  }
  if (typeof result === 'string' && result.trim().length === 0) {
    throw new Error(`${label} ha restituito una risposta vuota.`);
  }
  if (Array.isArray(result) && result.length === 0) {
    throw new Error(`${label} non ha generato alcun contenuto.`);
  }

  return result;
}

function formatAgentOutput(result) {
  if (typeof result === 'string') {
    return result;
  }

  if (Array.isArray(result)) {
    return result.map((item, i) => `${i + 1}. ${item}`).join('\n');
  }

  if (result && typeof result === 'object') {
    // Summary Agent's bulk JSON output — surface the most relevant fields
    // rather than dumping the raw JSON into the chat-style "answer" field.
    const parts = [];
    if (result.summary_short) parts.push(result.summary_short);
    if (result.summary_long) parts.push(result.summary_long);
    if (Array.isArray(result.highlights) && result.highlights.length > 0) {
      parts.push(result.highlights.map(h => `• ${h}`).join('\n'));
    }
    return parts.length > 0 ? parts.join('\n\n') : JSON.stringify(result);
  }

  return String(result);
}

// docs/AI_AGENTS.md — Agent Lifecycle (~91-112):
// User Request -> Agent Selection -> Agent Execution -> Response Validation -> Final Response.
async function ask({ message, context = {} }, llmClient) {
  const selected = selectAgents(message);
  const sharedContext = { ...context, conversationHistory: context.conversationHistory || [] };

  const sections = [];
  const agentsUsed = [];

  for (const agentKey of selected) {
    const rawResult = await runAgent(agentKey, message, sharedContext, llmClient);
    const validated = validateAgentResult(agentKey, rawResult);

    agentsUsed.push(AGENT_LABELS[agentKey]);
    sections.push(
      selected.length > 1
        ? `## ${AGENT_LABELS[agentKey]}\n${formatAgentOutput(validated)}`
        : formatAgentOutput(validated)
    );
  }

  return {
    answer: sections.join('\n\n'),
    agents_used: agentsUsed
  };
}

export default { ask, selectAgents };

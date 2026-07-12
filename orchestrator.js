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
    // "sintesi"/"sintetizza" are matched as whole words (\b) so that words
    // merely containing that substring (e.g. "fotosintesi") don't false-match
    // and get incorrectly routed here instead of to Tutor Agent.
    pattern: /\briassum|\bsintetizza\b|\bsintesi\b/i,
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

// Slice 1 (protezione costi) — vedi studiopro-slice-1-costi.md, punto 1.
//
// Il rate limiter conta QUANTE richieste arrivano, non QUANTO sono grandi:
// senza questi limiti un chiamante entro le 40/ora potrebbe comunque gonfiare
// il costo di ogni singola richiesta con campi enormi. Il troncamento avviene
// qui (non nel frontend) perché un chiamante diretto (curl) bypassa
// completamente il frontend e qualunque limite lì imposto.
//
// Soglie generose rispetto all'uso reale (per non rompere casi legittimi) ma
// finite (per limitare il danno):
// - fullText: 8000 char, stesso limite già usato da Summary Agent per il
//   testo del documento intero — congruente con la fonte più "grande" prevista.
// - summary_short: l'AI genera 2-3 righe (~150-300 char); 1000 dà ampio margine.
// - summary_long: l'AI genera 5-7 righe (~500-1500 char); 3000 dà ampio margine.
// - highlights: l'AI ne genera esattamente 5; 20 voci da 500 char ciascuna è
//   già molto oltre qualunque uso legittimo.
// - subject/name: stringhe brevi provenienti da un <select> o da un nome file.
// - card.q/card.a, glossaryItem.term/definition, highlight (singolo punto
//   saliente): contenuti pensati per essere brevi (una domanda, un termine,
//   una definizione); 500-1000 char coprono qualunque caso reale.
const FIELD_LIMITS = {
  subject: 100,
  name: 200,
  fullText: 8000,
  summary_short: 1000,
  summary_long: 3000,
  highlightItem: 500,
  qOrA: 1000,
  glossaryField: 500
};
const MAX_HIGHLIGHTS = 20;

function truncate(value, maxLen) {
  if (typeof value !== 'string') return value;
  return value.length > maxLen ? value.slice(0, maxLen) : value;
}

function sanitizeCard(card) {
  if (!card || typeof card !== 'object') return card;
  return {
    q: truncate(card.q, FIELD_LIMITS.qOrA),
    a: truncate(card.a, FIELD_LIMITS.qOrA)
  };
}

function sanitizeGlossaryItem(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    term: truncate(item.term, FIELD_LIMITS.glossaryField),
    definition: truncate(item.definition, FIELD_LIMITS.glossaryField)
  };
}

function selectAgents(message) {
  for (const rule of SELECTION_RULES) {
    if (rule.pattern.test(message)) {
      return rule.agents.length > 0 ? rule.agents : DEFAULT_AGENTS;
    }
  }
  return DEFAULT_AGENTS;
}

// Explicit agent override: the optional "agent" field on the request body
// (see api/v1/ai/ask.js) bypasses selectAgents()'s keyword matching entirely
// and forces a specific agent. Used by callers that already know which agent
// they want regardless of message content — e.g. the chat panel in
// public/index.html always sends { agent: 'tutor' } so free-form chat
// messages don't get accidentally misrouted to Summary/Quiz/MindMap Agent
// based on keywords the user happened to type.
const AGENT_OVERRIDES = {
  tutor: ['tutorAgent'],
  summary: ['summaryAgent'],
  quiz: ['quizAgent'],
  mindmap: ['mindMapAgent']
};

function resolveAgents(message, agentOverride) {
  if (!agentOverride) {
    return selectAgents(message);
  }

  const forced = AGENT_OVERRIDES[agentOverride];
  if (!forced) {
    throw new Error(`Orchestrator: valore "agent" sconosciuto "${agentOverride}".`);
  }
  return forced;
}

// Adapts the orchestrator's generic {message, context} contract into the
// "study" shape agents/tutorAgent.js, quizAgent.js and mindMapAgent.js expect
// (there is no document/database backend yet, so context is whatever the
// caller supplies, filled in with safe defaults).
function buildStudyLikeContext(context) {
  const highlights = Array.isArray(context.highlights) ? context.highlights : [];

  return {
    subject: truncate(context.subject || '', FIELD_LIMITS.subject),
    name: truncate(context.name || context.document_id || 'Documento', FIELD_LIMITS.name),
    fullText: truncate(context.fullText || context.text || '', FIELD_LIMITS.fullText),
    data: {
      summary_short: truncate(context.summary_short || '', FIELD_LIMITS.summary_short),
      summary_long: truncate(context.summary_long || context.summary_short || '', FIELD_LIMITS.summary_long),
      highlights: highlights
        .slice(0, MAX_HIGHLIGHTS)
        .map(h => truncate(typeof h === 'string' ? h : String(h), FIELD_LIMITS.highlightItem))
    }
  };
}

// "task" (optional, forwarded from the request body's "task" field via
// api/v1/ai/ask.js) selects which of agents/tutorAgent.js's or
// agents/quizAgent.js's task branches to run, instead of always defaulting to
// 'chat' / 'essayQuestions'. It only makes sense together with an explicit
// "agent" override (see resolveAgents) that pins a single agent — with
// automatic multi-agent selection (the "esame domani" combo) a single task
// override would be applied to every selected agent and likely fail for the
// ones that don't recognize it, so callers shouldn't combine the two.
function runTutorAgent(task, study, message, context, llmClient) {
  switch (task) {
    case 'chat':
      return agents.tutorAgent.run({
        task,
        study,
        message,
        conversationHistory: context.conversationHistory || []
      }, llmClient);

    case 'explainHighlight':
      return agents.tutorAgent.run({
        task,
        study,
        highlight: truncate(context.highlight || '', FIELD_LIMITS.highlightItem)
      }, llmClient);

    case 'glossaryExample':
      return agents.tutorAgent.run({ task, study, glossaryItem: sanitizeGlossaryItem(context.glossaryItem) }, llmClient);

    case 'flashcardExplain':
      return agents.tutorAgent.run({ task, card: sanitizeCard(context.card) }, llmClient);

    case 'flashcardExample':
      return agents.tutorAgent.run({ task, study, card: sanitizeCard(context.card) }, llmClient);

    case 'conceptAnalysis':
      return agents.tutorAgent.run({ task, study }, llmClient);

    default:
      throw new Error(`Orchestrator: task sconosciuto "${task}" per Tutor Agent.`);
  }
}

function runQuizAgent(task, study, context, llmClient) {
  switch (task) {
    case 'essayQuestions':
      return agents.quizAgent.run({ task, study }, llmClient);

    case 'flashcardEssay':
      return agents.quizAgent.run({ task, card: sanitizeCard(context.card) }, llmClient);

    default:
      throw new Error(`Orchestrator: task sconosciuto "${task}" per Quiz Agent.`);
  }
}

async function runAgent(agentKey, message, context, llmClient, taskOverride) {
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
      return runTutorAgent(taskOverride || 'chat', study, message, context, llmClient);

    case 'quizAgent':
      return runQuizAgent(taskOverride || 'essayQuestions', study, context, llmClient);

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
async function ask({ message, context = {}, agent, task }, llmClient) {
  const selected = resolveAgents(message, agent);
  const sharedContext = { ...context, conversationHistory: context.conversationHistory || [] };

  const sections = [];
  const agentsUsed = [];

  for (const agentKey of selected) {
    const rawResult = await runAgent(agentKey, message, sharedContext, llmClient, task);
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

export default { ask, selectAgents, resolveAgents };

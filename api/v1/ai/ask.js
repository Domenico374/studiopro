// docs/API_DESIGN.md — "AI Agent APIs / Ask StudioPro" (~309-344).
// Thin HTTP layer: shapes the request/response and injects the OpenAI SDK
// client as the llmClient; all routing/aggregation logic lives in
// orchestrator.js.

import { OpenAI } from 'openai';
import orchestrator from '../../../orchestrator.js';
import rateLimiter from '../../../rateLimiter.js';
import requestGuards from '../../../requestGuards.js';

// Timeout Summary Agent (audit 4.1) — vedi api/generate.js per il ragionamento
// completo. Applicato anche qui perché questo endpoint può raggiungere lo
// stesso Summary Agent (agents/summaryAgent.js, via agent:'summary' o
// keyword-matching in orchestrator.js) con lo stesso rischio di durata.
export const config = { maxDuration: 300 };

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const RATE_LIMIT = Number(process.env.RATE_LIMIT_AI_ASK_PER_HOUR) || 40;
const RATE_WINDOW_MS = 60 * 60 * 1000;

// Slice 1 (protezione costi) — vedi studiopro-slice-1-costi.md, punto 1.
// Stessa soglia di api/chat.js (2000 char): "message" qui è sempre un testo
// breve digitato o generato lato client (una domanda, una richiesta di
// chiarimento), mai il contenuto del documento — quello viaggia in "context".
const MAX_MESSAGE_LENGTH = 2000;

// Slice 1 — vedi studiopro-slice-1-costi.md, punto 3. Origine ristretta al
// dominio reale dell'app: le chiamate legittime sono sempre same-origin
// (public/index.html chiama con URL relativi), quindi restringere non rompe
// l'uso normale — blocca solo un sito esterno che provi a usare questo
// endpoint dal browser di un visitatore.
const ALLOWED_ORIGIN = 'https://mentorestudio.vercel.app';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Utilizzare POST per questo endpoint', status: 405 }
    });
  }

  // Slice 1, punto 4: cap esplicito sulla dimensione del body, prima di
  // qualunque altra elaborazione (incluso il controllo della API key, per
  // rifiutare il più presto possibile).
  if (requestGuards.isBodyTooLarge(req)) {
    return res.status(413).json({
      success: false,
      data: null,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: `Il corpo della richiesta supera il limite di ${Math.floor(requestGuards.MAX_BODY_BYTES / 1024)}KB`,
        status: 413
      }
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'CONFIG_MISSING', message: 'OPENAI_API_KEY non configurata', status: 500 }
    });
  }

  const blocked = await rateLimiter.applyRateLimit(req, res, {
    name: 'ai-ask',
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS
  });
  if (blocked) return;

  // "agent" (optional): forces a specific agent ('tutor' | 'summary' | 'quiz' | 'mindmap'),
  // bypassing orchestrator.js's keyword-based selectAgents(). See orchestrator.js
  // (AGENT_OVERRIDES/resolveAgents) for the accepted values and the reasoning.
  // "task" (optional): selects which task branch of the forced agent to run
  // (e.g. 'glossaryExample', 'flashcardExplain' for Tutor Agent; 'flashcardEssay'
  // for Quiz Agent) — see orchestrator.js's runTutorAgent/runQuizAgent.
  const { message, context, agent, task } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'MISSING_MESSAGE', message: 'Il campo "message" è obbligatorio', status: 400 }
    });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'MESSAGE_TOO_LONG',
        message: `Il campo "message" non può superare ${MAX_MESSAGE_LENGTH} caratteri`,
        status: 400
      }
    });
  }

  try {
    const data = await orchestrator.ask({ message, context: context || {}, agent, task }, openai);
    return res.status(200).json({ success: true, data, error: null });
  } catch (error) {
    console.error('Errore AI Orchestrator:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'ORCHESTRATOR_ERROR', message: error.message, status: 500 }
    });
  }
}

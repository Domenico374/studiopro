// docs/API_DESIGN.md — "AI Agent APIs / Ask StudioPro" (~309-344).
// Thin HTTP layer: shapes the request/response and injects the OpenAI SDK
// client as the llmClient; all routing/aggregation logic lives in
// orchestrator.js.

import { OpenAI } from 'openai';
import orchestrator from '../../../orchestrator.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'CONFIG_MISSING', message: 'OPENAI_API_KEY non configurata', status: 500 }
    });
  }

  const { message, context } = req.body || {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { code: 'MISSING_MESSAGE', message: 'Il campo "message" è obbligatorio', status: 400 }
    });
  }

  try {
    const data = await orchestrator.ask({ message, context: context || {} }, openai);
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

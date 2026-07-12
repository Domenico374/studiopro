import { OpenAI } from 'openai';
import rateLimiter from '../rateLimiter.js';
import requestGuards from '../requestGuards.js';



const openai = new OpenAI({

  apiKey: process.env.OPENAI_API_KEY,

});

const RATE_LIMIT = Number(process.env.RATE_LIMIT_GENERATE_PER_HOUR) || 15;
const RATE_WINDOW_MS = 60 * 60 * 1000;



// Funzione principale per generare contenuti didattici

async function generateContent(text) {

  const system_prompt = `

Sei un esperto creatore di materiali didattici. Analizza il testo fornito e restituisci ESCLUSIVAMENTE un oggetto JSON con la seguente struttura:



{

  "summary_short": "Un riassunto di 2-3 righe",

  "summary_long": "Un riassunto dettagliato di 5-7 righe",

  "highlights": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"],

  "glossary": [ {"term": "termine", "definition": "definizione"} ],

  "mind_map": ["concetto 1", "concetto 2", ..., "concetto 8"],

  "timeline": [ {"date": "data", "event": "evento"} ],

  "flashcards": [ {"q": "Domanda?", "a": "Risposta"} ],

  "quiz": [ {"q": "Domanda?", "options": ["A", "B", "C", "D"], "correct": 0} ]

}



REQUISITI:

- highlights: esattamente 5

- glossary: 8–10 termini

- mind_map: 8 concetti

- flashcards: 20–25

- quiz: 15–20 domande

- Rispetta il formato JSON rigorosamente

`;



  try {

    const response = await openai.chat.completions.create({

      model: 'gpt-4o-mini',

      response_format: { type: 'json_object' },

      messages: [

        { role: 'system', content: system_prompt },

        { role: 'user', content: `Analizza il testo qui sotto:\n\n${text}` }

      ],

      temperature: 0.7,

      max_tokens: 3000,

    });



    const jsonString = response.choices[0].message.content;

    return JSON.parse(jsonString);

  } catch (error) {

    console.error('Errore OpenAI:', error);

    throw error;

  }

}



// Endpoint API

// Slice 1 (protezione costi) — vedi studiopro-slice-1-costi.md, punto 3.
// Origine ristretta al dominio reale dell'app: le chiamate legittime sono
// sempre same-origin (public/index.html chiama con URL relativi).
const ALLOWED_ORIGIN = 'https://mentorestudio.vercel.app';

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');



  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo non consentito' });



  // Slice 1, punto 4: cap esplicito sulla dimensione del body, prima di
  // qualunque elaborazione.
  if (requestGuards.isBodyTooLarge(req)) {
    return res.status(413).json({
      error: 'Richiesta troppo grande',
      message: `Il corpo della richiesta supera il limite di ${Math.floor(requestGuards.MAX_BODY_BYTES / 1024)}KB`
    });
  }

  if (!process.env.OPENAI_API_KEY) {

    return res.status(500).json({ error: 'OPENAI_API_KEY non configurata' });

  }



  const blocked = await rateLimiter.applyRateLimit(req, res, {

    name: 'generate',

    limit: RATE_LIMIT,

    windowMs: RATE_WINDOW_MS

  });

  if (blocked) return;



  try {

    const { text } = req.body;

    if (!text || text.length < 10) {

      return res.status(400).json({ error: 'Testo PDF vuoto o troppo breve' });

    }



    const limitedText = text.substring(0, 8000);

    const data = await generateContent(limitedText);

    res.status(200).json(data);

  } catch (error) {

    console.error('Errore nella generazione:', error);

    res.status(500).json({

      error: 'Errore server: generazione fallita o formato non valido',

      message: error.message,

    });

  }

}

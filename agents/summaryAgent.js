// Extracted from api/generate.js (generateContent, lines 15-99) — no prompt/behavior changes.

const name = 'Summary Agent';

const systemPrompt = `
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

function buildPrompt(input) {
  const { text } = input;
  const limitedText = (text || '').substring(0, 8000);

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Analizza il testo qui sotto:\n\n${limitedText}` }
  ];
}

async function run(input, llmClient) {
  const messages = buildPrompt(input);

  const response = await llmClient.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages,
    temperature: 0.7,
    max_tokens: 3000
  });

  const jsonString = response.choices[0].message.content;
  return JSON.parse(jsonString);
}

export default { name, systemPrompt, buildPrompt, run };

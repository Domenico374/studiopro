// Endpoint per la chat AI migliorato

import rateLimiter from '../rateLimiter.js';

const RATE_LIMIT = Number(process.env.RATE_LIMIT_CHAT_PER_HOUR) || 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Metodo non consentito',
      message: 'Utilizzare POST per questo endpoint'
    });
  }

  const blocked = await rateLimiter.applyRateLimit(req, res, {
    name: 'chat',
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW_MS
  });
  if (blocked) return;

  try {
    const { message, conversationHistory = [] } = req.body;

    // Validazione dell'input del messaggio
    if (!message) {
      return res.status(400).json({ 
        error: 'Messaggio mancante',
        message: 'Il campo "message" è obbligatorio' 
      });
    }

    if (typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Tipo di dato non valido',
        message: 'Il messaggio deve essere una stringa' 
      });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Messaggio vuoto',
        message: 'Il messaggio non può essere vuoto' 
      });
    }

    // Limita la lunghezza del messaggio per evitare abusi
    const MAX_MESSAGE_LENGTH = 2000;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ 
        error: 'Messaggio troppo lungo',
        message: `Il messaggio non può superare ${MAX_MESSAGE_LENGTH} caratteri` 
      });
    }

    // Validazione dello storico della conversazione
    if (!Array.isArray(conversationHistory)) {
      return res.status(400).json({ 
        error: 'Storico non valido',
        message: 'conversationHistory deve essere un array' 
      });
    }

    // Prepara i messaggi per OpenAI
    const messages = [
      { role: 'system', content: 'Sei un assistente utile e cortese.' }
    ];

    // Aggiungi storico conversazione (mantieni le risposte sotto i 200 token, a meno che non sia richiesta una spiegazione dettagliata)
    // Limita a 10 messaggi più recenti per gestire meglio il contesto
    const MAX_HISTORY_LENGTH = 10;
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-MAX_HISTORY_LENGTH);
      
      // Valida ogni messaggio nello storico
      for (const msg of recentHistory) {
        if (msg && msg.role && msg.content) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }

    // Aggiungi messaggio corrente
    messages.push({ role: 'user', content: message });

    // Verifica la presenza della chiave API
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY non configurata');
      return res.status(500).json({ 
        error: 'Configurazione mancante',
        message: 'Il servizio non è configurato correttamente' 
      });
    }

    // Chiama OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000, // Aumentato da 500 per risposte più complete
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.6
      })
    });

    // Gestione errori HTTP della risposta OpenAI
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Errore API OpenAI:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });

      // Gestisci errori specifici di OpenAI
      if (response.status === 401) {
        return res.status(500).json({ 
          error: 'Autenticazione fallita',
          message: 'Problema con la chiave API' 
        });
      }

      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Limite richieste superato',
          message: 'Troppi tentativi. Riprova tra qualche istante' 
        });
      }

      if (response.status === 400) {
        return res.status(400).json({ 
          error: 'Richiesta non valida',
          message: 'I parametri inviati non sono corretti' 
        });
      }

      return res.status(response.status).json({ 
        error: 'Errore API esterna',
        message: errorData.error?.message || 'Errore nel servizio di AI' 
      });
    }

    const data = await response.json();

    // Valida la risposta ricevuta
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Formato risposta OpenAI non valido:', data);
      return res.status(500).json({ 
        error: 'Risposta non valida',
        message: 'Formato di risposta inatteso dal servizio AI' 
      });
    }

    const aiResponse = data.choices[0].message.content;

    // Log per monitoraggio (rimuovi in produzione o usa un logger appropriato)
    console.log('Chat completata:', {
      messageLength: message.length,
      responseLength: aiResponse.length,
      tokensUsed: data.usage
    });

    // Invia la risposta al client
    return res.status(200).json({
      response: aiResponse,
      usage: data.usage, // Informazioni sull'utilizzo dei token
      model: data.model
    });

  } catch (error) {
    // Log dettagliato dell'errore per debugging
    console.error('Errore nella generazione della risposta AI:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Gestisci errori di rete
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return res.status(503).json({ 
        error: 'Servizio non disponibile',
        message: 'Impossibile raggiungere il servizio AI. Riprova più tardi' 
      });
    }

    // Errore generico
    return res.status(500).json({
      error: 'Errore interno del server',
      message: 'Si è verificato un errore durante l\'elaborazione della richiesta'
    });
  }
}

// Misurazione dell'uso dell'AI (primo passo del piano "rendere StudioPro
// un progetto professionale": senza dati su costi e tempi ogni decisione è
// un'ipotesi).
//
// Avvolge una chiamata OpenAI e scrive UNA riga JSON per chiamata nei log di
// Vercel (cercabile con `"type":"ai_call"`), con: da dove arriva la chiamata,
// modello, durata, token usati ed esito.
//
// Scelte deliberate:
// - NON registra mai il contenuto di prompt o risposte (testi degli studenti):
//   solo metadati. Per lo stesso motivo non registra il messaggio d'errore,
//   che a volte cita parti della chiave API; solo nome, status e codice.
// - Registra i token, NON il costo in euro: i prezzi cambiano, i token no.
//   Il costo si calcola a posteriori dai log con il listino del momento.
// - Il logging non deve mai rompere la richiesta: ogni errore interno viene
//   ingoiato, e l'eventuale errore della chiamata AI viene rilanciato intatto.

function usageOf(response) {
  const usage = response && response.usage;
  if (!usage) return {};
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens
  };
}

function writeLog(entry) {
  try {
    console.log(JSON.stringify({ type: 'ai_call', ts: new Date().toISOString(), ...entry }));
  } catch {
    // Mai far fallire la richiesta per un problema di logging.
  }
}

async function trackAiCall(meta, fn) {
  const startedAt = Date.now();
  try {
    const response = await fn();
    writeLog({ ...meta, status: 'ok', durationMs: Date.now() - startedAt, ...usageOf(response) });
    return response;
  } catch (error) {
    writeLog({
      ...meta,
      status: 'error',
      durationMs: Date.now() - startedAt,
      errorName: error && error.name,
      errorStatus: error && error.status,
      errorCode: error && error.code
    });
    throw error;
  }
}

export default { trackAiCall };

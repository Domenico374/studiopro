// Slice 1 (protezione costi) — vedi studiopro-slice-1-costi.md, punto 4.
//
// Cap esplicito sulla dimensione del body, applicato PRIMA di qualunque
// elaborazione. Non ci si affida solo al limite di piattaforma di Vercel
// (4.5MB su Hobby): quel limite è pensato per evitare crash/timeout, non per
// contenere il costo di un payload che l'app elabora comunque per intero.
//
// req.body arriva già parsato da Vercel (JSON auto-parse) prima che questo
// handler venga eseguito, quindi non c'è un modo semplice per contare i byte
// "grezzi" senza disabilitare il body parser di default — cosa che
// introdurrebbe complessità/rischio sproporzionati per questa slice (vedi
// "Cosa NON fare": niente dipendenze pesanti, niente riscritture rischiose).
// Si misura quindi la dimensione del body già parsato: è una proxy fedele
// per "quanto contenuto sta per essere processato", che è esattamente il
// rischio di costo che questo controllo vuole limitare.
const MAX_BODY_BYTES = 100 * 1024; // 100KB — soglia indicata dalla spec.

function getBodySizeBytes(req) {
  try {
    return Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
  } catch {
    return 0;
  }
}

function isBodyTooLarge(req, maxBytes = MAX_BODY_BYTES) {
  return getBodySizeBytes(req) > maxBytes;
}

// Interruttore di emergenza: con AI_DISABLED=true (variabile d'ambiente su
// Vercel, si cambia dalla dashboard senza modificare il codice) tutti gli
// endpoint che chiamano OpenAI rispondono 503 prima di fare qualunque cosa.
// Serve a fermare subito la spesa in caso di abuso o di costi inattesi. Si
// legge a ogni richiesta (non all'import) così il cambio ha effetto al
// successivo deploy senza altre modifiche.
const AI_DISABLED_MESSAGE = 'Il servizio AI è temporaneamente sospeso. Riprova più tardi.';

function isAiDisabled() {
  return process.env.AI_DISABLED === 'true';
}

export default { isBodyTooLarge, getBodySizeBytes, MAX_BODY_BYTES, isAiDisabled, AI_DISABLED_MESSAGE };

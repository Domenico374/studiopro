// Rate limiting per proteggere gli endpoint AI da abusi e costi OpenAI
// incontrollati (docs/AI_AGENTS.md "Implementation Status" — sicurezza).
//
// Interfaccia astratta: checkLimit(key, {limit, windowMs}) -> {allowed, remaining, resetAt}.
// Oggi esiste un solo backend (in-memory); un backend esterno condiviso
// (es. Upstash Redis) potrà essere aggiunto in futuro sostituendo solo
// checkLimitInMemory, senza toccare gli endpoint che chiamano applyRateLimit().
//
// LIMITE NOTO: su Vercel serverless più istanze concorrenti della stessa
// funzione hanno memoria separata, quindi questo contatore non è condiviso
// tra istanze e si azzera ai cold start. È una mitigazione per abusi
// accidentali (click ripetuti, loop), non una difesa robusta contro un
// abuso deliberato — per quello servirebbe uno store esterno condiviso.
//
// Fail-open per scelta esplicita: se il rate limiter stesso ha un problema
// interno, la richiesta passa comunque (meglio un'ora scoperta che
// studenti bloccati).

const store = new Map(); // key -> { count, resetAt }

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}

function checkLimitInMemory(key, limit, windowMs) {
  const now = Date.now();
  cleanupExpired(now);

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

async function checkLimit(key, { limit, windowMs }) {
  try {
    return checkLimitInMemory(key, limit, windowMs);
  } catch (error) {
    console.error('RateLimiter: errore interno, fail-open', error);
    return { allowed: true, remaining: limit, resetAt: Date.now() + windowMs };
  }
}

// Vercel imposta x-forwarded-for con l'IP reale del client come primo valore.
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

// Applica il limite e, se superato, scrive già la risposta 429 standard
// {success, data, error} con header Retry-After. Ritorna true se la
// richiesta è stata bloccata (il chiamante deve fare `return` subito dopo).
async function applyRateLimit(req, res, { name, limit, windowMs }) {
  const ip = getClientIp(req);
  const key = `${name}:${ip}`;
  const result = await checkLimit(key, { limit, windowMs });

  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));

  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      data: null,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Hai raggiunto il limite di richieste per questa ora. Riprova tra qualche minuto.',
        status: 429
      }
    });
    return true;
  }

  return false;
}

export default { checkLimit, applyRateLimit, getClientIp };

# Slice 1 — Protezione Costi

Prima slice di miglioramento StudioPro. Obiettivo: chiudere i buchi che permettono a qualcuno di consumare il credito OpenAI del proprietario. Nient'altro.

Questa slice NON tocca: bug del localStorage, timeout di summaryAgent, funzioni finte (QR code, Stats/Settings), codice morto. Sono le slice successive.

## Contesto
StudioPro: piattaforma AI di apprendimento su Vercel. Architettura multi-agente (Summary, Tutor, Quiz, MindMap + orchestrator). Frontend in un unico public/index.html (scelta di progetto, NON va rifattorizzato). Endpoint AI: /api/v1/ai/ask (il principale), /api/chat, /api/generate. Rate limiter esistente: 40 richieste/ora, in-memory.
L'app costa denaro reale a ogni utilizzo, e una singola richiesta può attivare più agenti.

## Interventi richiesti

### 1. Limitare la DIMENSIONE degli input (CRITICO — il buco principale)
Il rate limiter conta QUANTE richieste arrivano (40/ora), ma non QUANTO sono grandi. Qualcuno può inviare 40 richieste entro il limite, ognuna con un message o un context.fullText/context.highlights enorme, gonfiando il costo di ciascuna.
- Validare e troncare LATO SERVER il campo message (es. max 2000-4000 caratteri, coerente con api/chat.js) su /api/v1/ai/ask.
- Validare e troncare ogni campo rilevante di context in orchestrator.js PRIMA di costruire qualunque prompt (fullText, highlights, e ogni altro campo che finisce nel prompt).
- Il troncamento deve avvenire lato server SEMPRE, indipendentemente da cosa manda il frontend. Un chiamante che bypassa il frontend (curl diretto) non è vincolato da nulla che il frontend faccia.
- Scegli tu le soglie precise, ma motivamele: generose abbastanza da non rompere l'uso legittimo, strette abbastanza da limitare il danno.

### 2. Rate limiter e IP falsificabile (CRITICO — ma VERIFICA prima di correggere)
rateLimiter.js (getClientIp) prende il PRIMO valore di x-forwarded-for. Se Vercel antepone il valore fornito dal client, un attaccante può falsificare l'header, apparire come "IP nuovo" a ogni richiesta e aggirare completamente il limite di 40/ora.
ATTENZIONE: questa è un'IPOTESI, non una certezza — l'audit stesso lo dichiara. Quindi:
- PRIMA verifica empiricamente come si comporta Vercel con un X-Forwarded-For contraffatto (test reale contro l'app deployata, o documentazione ufficiale Vercel aggiornata).
- Solo se confermato manipolabile, correggi: usare l'ultimo valore della lista invece del primo, oppure un header non sovrascrivibile dal client se Vercel ne espone uno.
- Se invece Vercel già sanifica l'header e il codice è sicuro così com'è, DIMMELO E NON TOCCARE NULLA — non voglio "correggere" un non-problema e introdurre un bug vero.

### 3. Restringere il CORS
/api/v1/ai/ask e /api/generate hanno Access-Control-Allow-Origin: '*'. Rischio: una pagina esterna può far chiamare i tuoi endpoint dal browser di un visitatore ignaro, consumando la quota rate-limit dell'IP del visitatore.
- Restringere l'origine al dominio reale dell'app (https://mentorestudio.vercel.app).
- Verificare che non esista un caso d'uso legittimo cross-origin prima di stringere.
- Valutare se allineare anche api/chat.js (oggi non imposta CORS) per coerenza.

### 4. Cap esplicito sulla dimensione del body
Oggi ci si affida solo al limite di piattaforma Vercel (4.5MB), un payload enorme da accettare prima di qualunque controllo applicativo.
- Rifiutare esplicitamente body oltre una soglia ragionevole (es. 100KB) con un errore chiaro, PRIMA di processare.

**Implementato (requestGuards.js) — natura esatta della protezione, verificata empiricamente:**
Il limite di 100KB protegge dall'elaborazione applicativa e dalle chiamate OpenAI (il controllo scatta PRIMA del check OPENAI_API_KEY, del rate limiter e di qualunque chiamata a orchestrator/agenti — cioè prima di tutto ciò che costa credito reale). **NON è un filtro pre-parsing del body**: il controllo legge `req.body`, che Vercel ha già ricevuto per intero dal socket e già fatto `JSON.parse` prima ancora di invocare l'handler. Un payload di 150KB viene quindi comunque ricevuto e parsato per intero (verificato con un test HTTP reale: 150.044 byte letti dal socket prima della risposta 413) — il limite non riduce il consumo di banda o di CPU di parsing lato piattaforma per payload tra 100KB e il tetto Vercel di 4.5MB, riduce solo il rischio di costo OpenAI/elaborazione a valle. Non va quindi interpretato come una difesa contro il consumo di banda o il parsing del payload.

**Possibile evoluzione futura (fuori scope per questa slice):**
Per ottenere un vero filtro pre-parsing servirebbe:
- disabilitare il body parser automatico di Vercel (`export const config = { api: { bodyParser: false } }`);
- leggere manualmente lo stream della richiesta (`req.on('data', ...)`);
- interrompere la connessione non appena la soglia dei 100KB viene superata, prima di aver ricevuto/parsato il resto del body.
Non implementato qui: è una riscrittura più rischiosa (gestione manuale dello stream), coerente con "Cosa NON fare" — nessuna riscrittura rischiosa in questa slice.

## Cosa NON fare
- Non toccare localStorage, timeout summaryAgent, QR code, Stats/Settings, codice morto (slice successive).
- NON rifattorizzare public/index.html: il file unico è una scelta di progetto, non un difetto.
- Non sostituire il rate limiter in-memory con Upstash in questa slice (già in roadmap, non è il buco urgente).
- Non introdurre dipendenze pesanti.

## Definition of Done
- [ ] Un message o un context enorme inviato via curl diretto a /api/v1/ai/ask viene troncato o rifiutato lato server, indipendentemente dal frontend.
- [ ] Le soglie scelte sono documentate e motivate.
- [ ] Il comportamento di Vercel con X-Forwarded-For contraffatto è stato VERIFICATO (non ipotizzato), e la correzione applicata SOLO se il rischio è confermato.
- [ ] CORS ristretto al dominio dell'app sugli endpoint AI.
- [ ] Un body oltre soglia viene rifiutato con errore chiaro prima di essere processato.
- [ ] Nessuna regressione: l'app funziona normalmente per l'uso legittimo (caricamento documento, generazione, chat, quiz).

ATTENZIONE AI COSTI: ogni test che raggiunge gli agenti costa denaro reale, e una richiesta StudioPro può attivare più agenti. Usa il minimo indispensabile di chiamate reali — preferisci test che verificano il troncamento/rifiuto PRIMA della chiamata a OpenAI. Dimmi quante chiamate reali hai fatto.

Quando è tutto fatto: fermati, riepiloga cosa hai cambiato, cosa hai verificato e cosa devo verificare io, e proponi il commit.

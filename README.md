<p align="center">
  <img src="docs/assets/studiopro-banner.svg" alt="StudioPro — studia meglio dai tuoi appunti" width="100%">
</p>

<p align="center">
  <a href="https://mentorestudio.vercel.app"><b>🚀 Prova l'app</b></a> •
  <a href="#-come-provarla"><b>Come provarla</b></a> •
  <a href="docs/PROJECT_VISION.md"><b>Visione</b></a> •
  <a href="docs/PRODUCT_ROADMAP.md"><b>Roadmap</b></a> •
  <a href="docs/SYSTEM_ARCHITECTURE.md"><b>Architettura</b></a>
</p>

<p align="center">

![Stato](https://img.shields.io/badge/stato-beta-orange)
[![CI](https://github.com/Domenico374/studiopro/actions/workflows/ci.yml/badge.svg)](https://github.com/Domenico374/studiopro/actions/workflows/ci.yml)
![Licenza](https://img.shields.io/badge/licenza-MIT-blue)

</p>

---

# StudioPro

> **Aiutare a capire, non solo a memorizzare.**

StudioPro trasforma i tuoi appunti, le dispense e le slide in materiale di studio: carichi un documento e ottieni **riassunto, punti chiave, glossario, timeline, mappa mentale, flashcard e quiz**, più un tutor AI con cui parlare della lezione.

È una **versione beta**: funziona e viene usata, ma ha limiti che trovi elencati più sotto. Le segnalazioni di chi la prova sono la cosa più utile in questa fase.

---

# 🧪 Come provarla

1. Apri **[mentorestudio.vercel.app](https://mentorestudio.vercel.app)**.
2. Clicca **«✨ Prova con una lezione di esempio»**: è una lezione già pronta (la fotosintesi), per esplorare l'app senza caricare nulla.
3. Dalla lezione apri le sezioni: **Riassunto, Glossario, Timeline, Mappa Mentale, Flashcard, Quiz**.
4. Nelle flashcard gira la carta e prova **Spiega Semplice**, **Esempio** e **Domanda Saggio**.
5. Poi carica **un tuo documento** (PDF, TXT, DOCX, PPTX o un'immagine) e guarda cosa genera.

**Cosa ci aiuta di più sapere:** dove ti sei bloccato o non hai capito cosa fare, contenuti generati sbagliati o fuori tema, cose lente o che non rispondono, e cosa ti sarebbe servito e non c'era.

## Come segnalare un problema

Apri una segnalazione su GitHub: **[Nuova segnalazione](https://github.com/Domenico374/studiopro/issues/new/choose)**. Indica il browser che usi e, se possibile, i passaggi per riprodurre il problema.

---

# ✨ Cosa fa oggi

| Sezione | Cosa ottieni |
|---|---|
| 📝 Riassunto, ⭐ Punti salienti | Sintesi breve e lunga, i 5 concetti chiave |
| 📖 Glossario | Termini con definizione, e un esempio pratico generato su richiesta |
| 📅 Timeline | Eventi e date della lezione |
| 🧠 Mappa mentale | Mappa interattiva con zoom, generata dall'AI |
| 🎴 Flashcard | Domande e risposte, con spiegazione semplice, esempio e domanda da saggio generati su richiesta |
| ❓ Quiz | Domande a scelta multipla, punteggio, filtri su sbagliate/corrette/non viste, timer opzionale |
| 🔍 Analisi concetto | I tre pilastri fondamentali della lezione, con i collegamenti tra loro |
| 📘 Guida di studio | Una guida riassuntiva da ripassare |
| ✨ Crea il tuo | Formati personalizzati su tua richiesta, anche in PowerPoint |
| 💬 Chat AI | Un tutor che risponde conoscendo la lezione aperta |
| 📥 Esporta | La lezione in PDF |

**Formati accettati:** PDF, TXT, DOCX, PPTX e immagini (JPG/PNG, con riconoscimento del testo nel browser).

---

# ⚠️ Limiti da conoscere

- **Nessun account.** Le lezioni sono salvate **solo nel browser** che usi: se cambi dispositivo, usi la navigazione privata o cancelli i dati del sito, le perdi. Non c'è ancora un modo per recuperarle.
- **Documenti lunghi.** Dei PDF vengono lette le prime 20 pagine, e all'AI arrivano i primi 8.000 caratteri di testo. Un documento molto lungo viene quindi riassunto solo in parte.
- **Limiti d'uso orari**, per contenere i costi: circa 15 generazioni di documenti, 40 richieste AI e 20 messaggi di chat all'ora per connessione. Se li raggiungi vedrai un messaggio che ti dice quando riprovare.
- **L'AI può sbagliare.** Riassunti, quiz e spiegazioni vanno verificati sul materiale originale: sono un aiuto allo studio, non una fonte.
- **Funzioni ancora incomplete:** il progresso di studio per lezione non viene ancora salvato (ogni lezione risulta «Nuovo»), e non c'è ancora la condivisione di una lezione con altre persone.

---

# 🔒 Privacy

- Le lezioni restano **nel tuo browser**: StudioPro non ha un database né salva i tuoi documenti sui propri server.
- Per generare i contenuti, **il testo dei documenti e dei messaggi viene inviato a OpenAI**. Non caricare materiale riservato o dati personali altrui.
- StudioPro registra per ogni richiesta all'AI solo dati tecnici (durata, quantità di token, esito), **mai il contenuto** di documenti o conversazioni.

---

# 🏗 Come è fatto

```text
Browser (public/index.html — pagina unica, JavaScript senza framework)
        │
Funzioni serverless Vercel (api/)  ── limiti di dimensione, CORS, rate limit
        │
AI Orchestrator (orchestrator.js)  ── sceglie l'agente giusto per la richiesta
        │
Agenti (agents/)                   ── Summary · Tutor · Quiz · Mind Map
        │
OpenAI
```

- **Frontend:** una sola pagina HTML con JavaScript nativo, scelta di progetto. Niente build.
- **Backend:** funzioni serverless Node.js su Vercel. Nessun database.
- **AI:** OpenAI (`gpt-4o-mini` per la generazione completa, `gpt-3.5-turbo` per gli agenti).

Dettagli in [Architettura](docs/SYSTEM_ARCHITECTURE.md) e [Agenti AI](docs/AI_AGENTS.md).

## Protezioni sui costi

L'app costa a ogni uso, quindi è protetta su più livelli: limiti sulla dimensione dei messaggi e dei dati che arrivano all'AI, tetto di 100 KB sulle richieste, CORS ristretto al dominio dell'app, limiti orari per connessione e un **interruttore di emergenza** (`AI_DISABLED=true`) che spegne tutte le chiamate AI dalla dashboard di Vercel senza modificare il codice. Dettagli in [studiopro-slice-1-costi.md](studiopro-slice-1-costi.md).

---

# 🛠 Sviluppo in locale

**Requisiti:** Node.js 20 o superiore (la CI usa la 24) e, per provare l'app completa, un account [Vercel](https://vercel.com) e una chiave API OpenAI.

```bash
git clone https://github.com/Domenico374/studiopro.git
cd studiopro
npm ci
```

**Test** (non fanno chiamate di rete né spendono nulla):

```bash
npm test
```

**App completa in locale:**

```bash
cp .env.example .env     # poi inserisci la tua OPENAI_API_KEY
npx vercel dev
```

## Variabili d'ambiente

| Variabile | Obbligatoria | Cosa fa |
|---|---|---|
| `OPENAI_API_KEY` | sì | Chiave per le chiamate all'AI |
| `AI_DISABLED` | no | Con `true` spegne tutte le chiamate AI (risposta 503) |
| `RATE_LIMIT_GENERATE_PER_HOUR` | no | Generazioni di documenti all'ora per connessione (default 15) |
| `RATE_LIMIT_AI_ASK_PER_HOUR` | no | Richieste AI all'ora per connessione (default 40) |
| `RATE_LIMIT_CHAT_PER_HOUR` | no | Messaggi di chat all'ora per connessione (default 20) |

Non committare mai il file `.env`: è già escluso da `.gitignore`.

## Struttura del repository

```text
api/            funzioni serverless (generate, chat, v1/ai/ask, generaPptx)
agents/         agenti AI (summary, tutor, quiz, mindMap) e codice condiviso
public/         l'app (index.html, favicon, immagini)
tests/          test automatici (node --test, senza rete)
docs/           documentazione di progetto
orchestrator.js smista le richieste agli agenti e applica i limiti sui dati
rateLimiter.js  limiti orari per connessione
requestGuards.js  tetto sulla dimensione delle richieste e interruttore AI
usageLogger.js  log di durata e token di ogni chiamata AI (senza contenuti)
```

---

# 🗺 Prossimi passi

La direzione è passare da prototipo a prodotto: **account e salvataggio online delle lezioni**, progresso di studio persistente, limiti d'uso per utente e un piano di studio. Il quadro completo, con le fasi, è in [Product Roadmap](docs/PRODUCT_ROADMAP.md); i difetti noti e i rischi accettati sono in [Known Issues](docs/SYSTEM_ARCHITECTURE.md#known-issues--todo).

---

# 📚 Documentazione

| Documento | Contenuto |
|---|---|
| [Project Vision](docs/PROJECT_VISION.md) | Missione e visione del prodotto |
| [Product Roadmap](docs/PRODUCT_ROADMAP.md) | Fasi di sviluppo |
| [System Architecture](docs/SYSTEM_ARCHITECTURE.md) | Architettura, stato dell'implementazione, difetti noti |
| [AI Agents](docs/AI_AGENTS.md) | Il sistema multi-agente |
| [API Design](docs/API_DESIGN.md) | Specifica delle API |
| [Database Design](docs/DATABASE_DESIGN.md) | Schema dati previsto (non ancora implementato) |
| [Frontend Design](docs/FRONTEND_DESIGN.md) | Interfaccia e UX previste |

> I documenti di design descrivono anche la **architettura target**, più ampia di ciò che esiste oggi. Lo stato reale è nella sezione «Implementation Status» di [System Architecture](docs/SYSTEM_ARCHITECTURE.md).

---

# 🤝 Contribuire

Vedi [CONTRIBUTING.md](CONTRIBUTING.md). Segnalazioni e idee sono benvenute.

# 📄 Licenza

[MIT](LICENSE)

---

<p align="center">
<b>⭐ Aiutare a capire, non solo a memorizzare. ⭐</b>
</p>

# 🎓 StudioPro

## Product Roadmap

> **Version:** 2.0
>
> **Last updated:** July 2026
>
> **Status:** Active — Revised

## Contents

- Product Strategy
- Development Principles
- Product Evolution
- Overall Progress
- Development Phases
- MVP Definition
- Milestones
- Success Criteria
- Future Vision
- Project Status
- Decision Log

---

# Product Strategy

StudioPro sarà sviluppato attraverso un processo incrementale, organizzato in fasi ben definite.

Ogni fase introdurrà funzionalità complete, testate e realmente utilizzabili, evitando di accumulare caratteristiche incomplete o poco integrate.

L'obiettivo è costruire una piattaforma solida, modulare e facilmente estendibile, mantenendo sempre al centro l'esperienza dello studente.

Ogni decisione di sviluppo dovrà essere coerente con la Project Vision e contribuire a rendere lo studio più semplice, efficace e personalizzato.

La roadmap rappresenta la guida strategica del progetto e definisce le priorità di sviluppo di StudioPro.

> **Nota sulla revisione 2.0**: questa versione riordina le fasi successive alla Foundation sulla base dello stato reale del codice (agenti implementati, debiti tecnici trovati, rischi di sicurezza chiusi e aperti), non su una sequenza astratta. Il razionale di ogni fase — perché viene prima o dopo le altre — è documentato esplicitamente per ciascuna, proprio perché è la parte con più valore di questo documento.

---

# Development Principles

Durante lo sviluppo di StudioPro verranno sempre rispettati questi principi:

- Quality over Quantity
- User First
- AI as a Learning Companion
- Modular Architecture
- Incremental Development
- Continuous Testing

---

# Product Evolution

StudioPro crescerà attraverso nove fasi evolutive.

```text
Foundation (✅ completata)
      ↓
Testing & CI Infrastructure
      ↓
Technical Debt & Known Issues
      ↓
Database & Persistence
      ↓
Authentication
      ↓
Planner Agent & Distributed Rate Limiting
      ↓
Frontend Rewrite
      ↓
Beta
      ↓
Public Release
```

---

# Overall Progress

```text
[█░░░░░░░░] 1 / 9 fasi completate (~11%)
```

- ✅ Fase 1 — Foundation
- ⏳ Fase 2 — Testing & CI Infrastructure
- ⏳ Fase 3 — Technical Debt & Known Issues
- ⏳ Fase 4 — Database & Persistence
- ⏳ Fase 5 — Authentication
- ⏳ Fase 6 — Planner Agent & Distributed Rate Limiting
- ⏳ Fase 7 — Frontend Rewrite
- ⏳ Fase 8 — Beta
- ⏳ Fase 9 — Public Release

---

# Development Phases

## 🏗️ Phase 1 — Foundation

**Status**: ✅ Completed

**Objective**

Costruire le fondamenta del progetto — sia documentali sia tecniche.

**Focus (documentazione)**

- ✅ Documentazione (Vision, Roadmap, System Architecture, AI Agents, Database Design, API Design, Frontend Design)
- ✅ Repository e organizzazione del progetto
- ✅ Standard di sviluppo

**Focus (fondamenta tecniche reali)**

- ✅ AI Orchestrator (`orchestrator.js`) con selezione automatica per keyword + override espliciti `agent`/`task`
- ✅ 4 agenti su 5 implementati: Tutor, Summary, Quiz, Mind Map (`agents/`) — Planner ancora mancante, pianificato in Fase 6
- ✅ Primo endpoint versionato `POST /api/v1/ai/ask`, con 7 delle 9 funzionalità AI del frontend migrate
- ✅ Rate limiting su tutti e tre gli endpoint AI (`rateLimiter.js`), risposta 429 standard, gestione gentile lato frontend
- ✅ Sanitizzazione XSS sistematica (`escapeHTML()`/`escapeAttr()`), ~44 punti verificati

**Perché questa fase è chiusa e non riaperta**: rappresenta tutto ciò che è stato costruito finora ed è stabile, verificato (tokenizer strutturale + test browser-reale per la sicurezza) e in produzione. Le fasi successive costruiscono sopra queste fondamenta, non le rifanno.

---

## 🧪 Phase 2 — Testing & CI Infrastructure

**Status**: ⏳ Planned

**Objective**

Introdurre una rete di sicurezza automatica prima di qualunque altro intervento strutturale.

**Focus**

- Test che verifichi la validità sintattica dello script inline di `public/index.html` (formalizzare il tokenizer usato manualmente durante il lavoro di sicurezza)
- Smoke test sui tre endpoint AI (200 su input valido, 400/429 sui casi limite)
- Collegamento a GitHub Actions (già elencato come infrastruttura pianificata in `docs/SYSTEM_ARCHITECTURE.md`, mai attivato)

**Perché subito dopo la Foundation, prima di tutto il resto**: questo repository ha già avuto un'interruzione totale del servizio — una singola `}` mancante ha rotto l'intero script inline, rimasta invisibile dal primo commit fino a una verifica manuale. Senza un test automatico, ogni fase successiva (specialmente Database e Frontend Rewrite, che toccano molto codice) rischia di ripetere lo stesso incidente, ma su un sistema più complesso da diagnosticare. È l'investimento con il costo più basso e il ritorno più alto di tutta la roadmap.

---

## 🔧 Phase 3 — Technical Debt & Known Issues

**Status**: ⏳ Planned

**Objective**

Chiudere i debiti tecnici già isolati e compresi, prima che si accumulino o vengano dimenticati.

**Focus — Known Issues già documentati in `docs/SYSTEM_ARCHITECTURE.md`**

- `flashcardExample` (Tutor Agent) genera esempi fuori contesto — passare `study.name`/`summary_short` al prompt, come già fanno `conceptAnalysis` e `chat`
- `showShareModal` va in crash con caratteri fuori Latin-1 (emoji) in `btoa()` — sostituire con una codifica UTF-8-safe

**Focus — altri debiti tecnici trovati nel codice**

- Completare (o abbandonare consapevolmente, con decisione documentata) il **Mind Map Agent strutturato in JSON** (`{title, nodes, links}`), rimasto a metà: `agents/mindMapAgent.js` produce ancora testo ASCII
- Consolidare la **duplicazione quiz/mappa mentale**: il quiz a scelta multipla vive in Summary Agent, le domande da saggio in Quiz Agent; il campo `mind_map` piatto di Summary Agent non viene mai renderizzato (dato morto, generato e pagato inutilmente) mentre `mindmapDetailed` è la versione realmente usata
- Chiudere il Blocco 3 lasciato aperto: decidere se implementare un task `freeform` per `generateCustomFormat` o mantenerlo deliberatamente su `/api/chat`, documentando la scelta

**Perché prima del Database e non dopo**: sono debiti isolati, a basso rischio, già capiti a fondo — costano poco a sistemare ora, mentre il contesto è fresco. Rimandarli oltre questa fase significa rischiare che si perdano di vista man mano che la base di codice cresce con Database, Auth e Frontend Rewrite.

---

## 🗄️ Phase 4 — Database & Persistence

**Status**: ⏳ Planned

**Objective**

Sostituire `localStorage` con la persistenza reale già progettata in `docs/DATABASE_DESIGN.md` (PostgreSQL).

**Focus**

- Entità minime: Users (anche device-based/anonimi all'inizio), Documents, Study Sessions, Generated Content
- Migrazione delle funzioni frontend da `localStorage` a chiamate API

**Perché prima di Auth, Planner Agent e Frontend Rewrite**: è il salto più grande da "prototipo" a "prodotto" — oggi una cache del browser cancellata significa perdere tutto il materiale di studio, senza backup né sincronizzazione multi-dispositivo. È anche un blocco tecnico diretto per le fasi successive: l'Autenticazione richiede una tabella utenti, il Planner Agent richiede di persistere piani di studio nel tempo, e un rate limiter davvero condiviso (Fase 6) ha senso solo con un backend reale a cui appoggiarsi. Farla prima della riscrittura del frontend evita di dover riscrivere il frontend due volte — una per il framework, una per il passaggio da `localStorage` ad API.

---

## 🔐 Phase 5 — Authentication

**Status**: ⏳ Planned

**Objective**

Introdurre login reale e sessioni utente, collegati al Database della Fase 4.

**Focus**

- Autenticazione (email/password o OAuth)
- Gestione sessioni
- Collegamento alle entità Users già create in Fase 4

**Perché dopo il Database e prima del Planner Agent e del Frontend Rewrite**: dipende direttamente dalla tabella utenti introdotta in Fase 4. Va fatta prima del Planner Agent, che per natura è un concetto per-utente ("il MIO piano di studio"), e prima della riscrittura del frontend, così quest'ultima può includere i flussi di autenticazione fin dall'inizio invece di doverli innestare in un secondo momento.

---

## 📅 Phase 6 — Planner Agent, Distributed Rate Limiting & Auto Agent Selection

**Status**: ⏳ Planned

**Objective**

Completare il sistema multi-agente e maturare la sicurezza da "prototipo protetto" a "pronto per utenti reali".

**Focus**

- Implementare il quinto agente mancante, **Planner Agent** (`agents/plannerAgent.js`)
- Sostituire il rate limiter in-memory (`rateLimiter.js`) con uno store condiviso (es. Upstash Redis) — l'interfaccia astratta è già pronta per questo
- Rimuovere il bypass forzato `agent: 'tutor'` nel pannello chat, completando finalmente la tabella di selezione automatica di `docs/AI_AGENTS.md` (incluso il caso "Ho un esame domani", oggi mutilato per mancanza del Planner)

**Perché qui e non prima**: il Planner Agent ha senso solo con la persistenza reale della Fase 4 (per tracciare piani/scadenze nel tempo); il rate limiter condiviso ha senso quando ci sono utenti reali (Fase 5) di cui preoccuparsi per i costi, non prima — il limite in-memory è stato una scelta deliberata e sufficiente per un progetto senza utenti registrati.

---

## 🎨 Phase 7 — Frontend Rewrite (React/Next.js)

**Status**: ⏳ Planned

**Objective**

Migrare da `public/index.html` (HTML/CSS/JS vanilla, ~7600 righe) al frontend descritto in `docs/SYSTEM_ARCHITECTURE.md`.

**Focus**

- Migrazione a React/Next.js/TypeScript
- Componentizzazione delle funzionalità oggi concentrate in un unico file
- Integrazione nativa con Auth (Fase 5) e API del Database (Fase 4)

**Perché deliberatamente per ultima**: è la fase più attraente da fare per prima, ma anche quella con il rischio più alto di lavoro sprecato se anticipata. Il monolite attuale, una volta protetto dai test (Fase 2) e ripulito dai debiti (Fase 3), **funziona** — non blocca nient'altro. Riscriverlo prima che Database e Auth esistano significherebbe costruire UI per API non ancora pronte, o rifare il lavoro due volte. Fatta per ultima, ha un contratto backend stabile e collaudato su cui costruire.

---

## 👥 Phase 8 — Beta

**Status**: ⏳ Planned

**Objective**

Validare StudioPro con utenti reali.

**Focus**

- Test
- Feedback
- Correzione bug
- Ottimizzazione UX
- Performance

---

## 🚀 Phase 9 — Public Release

**Status**: ⏳ Planned

**Objective**

Pubblicare StudioPro 1.0.

**Focus**

- Release stabile
- Documentazione completa
- Deploy
- Presentazione del prodotto

---

# MVP Definition

La prima versione utilizzabile di StudioPro dovrà consentire allo studente di:

- autenticarsi
- creare un workspace di studio
- caricare documenti
- studiare con il Tutor Agent
- ottenere spiegazioni
- creare riassunti
- generare quiz
- salvare il proprio lavoro (persistito, non solo in `localStorage`)

Il completamento di queste funzionalità (Fasi 1-5 di questa roadmap) rappresenterà il Minimum Viable Product (MVP) del progetto.

---

# Milestones

- ✅ Project Vision
- ✅ Product Roadmap
- ✅ System Architecture
- ✅ AI Agents Design
- 🔄 Testing & CI Infrastructure
- ⏳ MVP Ready
- ⏳ Beta Release
- ⏳ Public Release 1.0

---

# Success Criteria

StudioPro sarà considerato pronto per la versione 1.0 quando:

- il sistema sarà stabile e coperto da test automatici
- almeno cinque agenti AI collaboreranno tra loro (oggi 4 su 5)
- i dati degli studenti saranno persistiti in modo affidabile, non solo nel browser
- la piattaforma sarà intuitiva
- la documentazione sarà completa
- uno studente potrà completare una sessione di studio dall'inizio alla fine utilizzando StudioPro
- il sistema potrà essere utilizzato senza necessità di documentazione tecnica

---

# Future Vision

Possibili evoluzioni future:

- Mobile App
- Voice Tutor
- Studio collaborativo
- Community
- Marketplace di contenuti
- Plugin
- Integrazione con LMS
- Supporto multi-lingua

---

## Project Status

🔄 In Development

### Current Phase

- ✅ Project Vision
- ✅ Product Roadmap
- ✅ System Architecture
- ✅ Agent Design
- ⏳ API Design
- ⏳ Database Design
- 🔄 Backend Development — AI Orchestrator, 4/5 agenti, rate limiting e XSS sanitization implementati; Testing/CI, Database, Auth, Planner Agent ancora da avviare

---

## Decision Log

### Version 1.0

- Created the official Product Roadmap.
- Defined the product evolution.
- Introduced the development principles.
- Identified the MVP.
- Established the main development phases.
- Defined the success criteria for the first public release.

### Version 2.0

- Replaced the post-Foundation phase sequence with an order derived from the actual codebase state, not an abstract plan.
- Phase 1 (Foundation) extended to document the real technical foundation completed so far: AI Orchestrator, 4/5 agents, the versioned `/api/v1/ai/ask` endpoint, rate limiting and XSS sanitization.
- Introduced Phase 2 (Testing & CI Infrastructure) as the top priority after Foundation, motivated by a real historical incident: a missing brace broke the entire inline script undetected from the first commit.
- Introduced Phase 3 (Technical Debt & Known Issues), folding in the Known Issues already tracked in `docs/SYSTEM_ARCHITECTURE.md` (flashcardExample, showShareModal) plus two additional debts found in this review: the incomplete structured Mind Map Agent JSON format, and the quiz/mind-map duplication across Summary/Quiz/Mind Map Agents.
- Reordered Database (Phase 4) before Authentication (Phase 5), and both before the Frontend Rewrite (Phase 7), to avoid rebuilding the frontend twice.
- Moved Planner Agent into Phase 6, alongside distributed rate limiting (Upstash) and re-enabling automatic agent selection in the chat panel — both gated on Database/Auth being in place.
- Added an "Overall Progress" section with a simple phase-completion indicator.
- Added explicit "why before/after" rationale to every phase, treated as the most valuable part of this revision.

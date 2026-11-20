# 🎓 MentoreStudio

## System Architecture

> **Version:** 1.2
>
> **Last updated:** July 2026
>
> **Status:** Draft — Partially Implemented

## Contents

- Architecture Overview
- Implementation Status
- Architecture Principles
- High-Level Architecture
- Core Components
- Frontend Layer
- Backend Layer
- AI Layer
- Multi-Agent System
- Data Layer
- Data Flow
- Technology Stack
- Infrastructure
- Security
- Known Issues / TODO
- Scalability
- Deployment
- Future Architecture
- Project Status
- Decision Log

---

# Architecture Overview

MentoreStudio sarà progettato come una piattaforma modulare composta da componenti indipendenti che comunicano attraverso API ben definite.

L'architettura seguirà il principio della separazione delle responsabilità, distinguendo chiaramente i diversi livelli del sistema:

- Presentazione
- Logica applicativa
- Intelligenza artificiale
- Gestione dei dati

Questa organizzazione consentirà alla piattaforma di evolvere nel tempo mantenendo elevati livelli di manutenibilità, estensibilità e scalabilità.

Il cuore dell'intera piattaforma sarà l'**AI Orchestrator**, responsabile del coordinamento degli agenti AI e dell'esecuzione dei workflow intelligenti.

---

# Implementation Status

Lo strato AI descritto in questo documento — AI Orchestrator + Multi-Agent System — ha una prima implementazione funzionante. Gli altri strati (Frontend React/Next.js, Backend Express, Database, Authentication, File Storage, Notification Service) restano allo stadio di prototipo o non implementati.

| Livello | Stato | Note |
|---|---|---|
| AI Orchestrator | ✅ Implementato | `orchestrator.js`, esposto via `POST /api/v1/ai/ask` |
| Multi-Agent System | 🔄 Parziale | 4 dei 5 agenti implementati in `agents/` (manca Planner Agent) — dettagli in `docs/AI_AGENTS.md` |
| API Gateway / versionamento | 🔄 Parziale | Solo `/api/v1/ai/ask` segue lo schema versionato `/api/v1/...`; gli endpoint legacy (`/api/chat`, `/api/generate`, `/api/generaPptx`) restano non versionati |
| Backend (Node.js/Express) | ⏳ Non implementato | Le funzioni sono serverless Vercel indipendenti, non un backend Express unificato |
| Frontend (React/Next.js) | ⏳ Non implementato | Prototipo tuttora in HTML/CSS/JS vanilla (`public/index.html`) |
| Database / Data Layer | ⏳ Non implementato | Nessun PostgreSQL/Vector DB; stato salvato in `localStorage` del browser |
| Authentication, File Storage, Notification Service | ⏳ Non implementato | — |

---

# Architecture Principles

L'architettura di MentoreStudio sarà guidata dai seguenti principi.

- Modular Architecture
- Separation of Concerns
- API-First Design
- AI-First Architecture
- Security by Design
- Scalability
- Maintainability
- Extensibility
- Observability
- Loose Coupling
- High Cohesion

---

# High-Level Architecture

```text
                              MentoreStudio

                         ┌─────────────────┐
                         │  Web Interface  │
                         └────────┬────────┘
                                  │
                           Frontend (React)
                                  │
                          REST / GraphQL API
                                  │
                        API Gateway / Backend
                                  │
 ┌────────────────┬───────────────┼───────────────┬─────────────────┐
 ▼                ▼               ▼               ▼                 ▼
Authentication Database     File Storage   Notification     AI Orchestrator
                                            Service               │
                                                                  │
                        ┌─────────────────────────────────────────┼────────────────────────────────────────┐
                        ▼                                         ▼                                        ▼
                  Tutor Agent                             Summary Agent                             Quiz Agent
                        ▼                                         ▼                                        ▼
                        └──────────────────────┬──────────────────┴──────────────────────┐
                                               ▼                                         ▼
                                        Planner Agent                           Mind Map Agent
                                               │
                                               ▼
                                       Shared Memory / Context
```

### Legend

- **Frontend** → User Interface
- **Backend** → Business Logic
- **AI Orchestrator** → Coordinates AI Agents
- **Agents** → Specialized AI services
- **Shared Memory** → Shared context between agents

---

# Core Components

I principali componenti della piattaforma saranno:

- Frontend
- Backend API
- API Gateway
- Authentication Service
- AI Orchestrator
- Multi-Agent System
- Database
- File Storage
- Notification Service

---

# Frontend Layer

Responsabilità:

- Dashboard
- Workspace
- Chat Interface
- Document Viewer
- Study Tools
- Authentication UI
- User Settings

---

# Backend Layer

Responsabilità:

- Business Logic
- User Management
- Session Management
- Document Management
- AI Request Routing
- Notification Management
- API Management

---

# AI Layer

L'AI Layer rappresenta il cuore intelligente di MentoreStudio.

Responsabilità:

- Prompt Management
- Context Management
- Conversation History
- Memory Management
- Tool Calling
- Model Routing
- Response Validation
- Agent Orchestration
- Agent Selection
- Workflow Execution

L'AI Layer potrà utilizzare differenti Large Language Models in base al tipo di richiesta.

L'AI Layer sarà completamente indipendente dall'interfaccia utente, permettendo di evolvere il sistema AI senza modificare il resto della piattaforma.

> **Stato di implementazione** delle responsabilità elencate sopra:
> ✅ Agent Orchestration, Agent Selection, Response Validation, Context Management (condiviso tra agenti nella stessa richiesta) — implementati in `orchestrator.js`.
> ⏳ Prompt Management centralizzato, Conversation History persistente, Memory Management, Tool Calling, Model Routing multi-provider — non ancora implementati; oggi ogni agente usa un unico modello OpenAI fisso (nessun Anthropic/routing dinamico).

---

# Multi-Agent System

MentoreStudio utilizzerà un ecosistema di agenti AI specializzati.

Ogni agente sarà responsabile di uno specifico compito e collaborerà con gli altri attraverso l'AI Orchestrator.

## Tutor Agent

Responsabilità

- spiegazioni
- tutoring personalizzato
- domande e risposte

✅ Implementato — `agents/tutorAgent.js` (dettagli task in `docs/AI_AGENTS.md`)

---

## Summary Agent

Responsabilità

- riassunti
- sintesi automatica
- estrazione dei concetti principali

✅ Implementato — `agents/summaryAgent.js`

---

## Quiz Agent

Responsabilità

- generazione quiz
- verifica dell'apprendimento
- valutazione delle risposte

🔄 Implementato parzialmente — `agents/quizAgent.js` (manca la valutazione automatica delle risposte, oggi client-side)

---

## Planner Agent

Responsabilità

- pianificazione dello studio
- organizzazione delle attività
- reminder

⏳ Non implementato — nessun modulo in `agents/`

---

## Mind Map Agent

Responsabilità

- mappe concettuali
- collegamento tra concetti
- visualizzazione della conoscenza

✅ Implementato — `agents/mindMapAgent.js`

---

# Data Layer

Il Data Layer gestirà:

- User Database
- Documents
- Conversations
- Study Sessions
- Generated Content
- AI Memory
- Embeddings
- Vector Database

---

# Data Flow

```text
User
   │
   ▼
Frontend
   │
   ▼
Backend API
   │
   ▼
AI Orchestrator
   │
   ▼
Selected Agent
   │
   ▼
Large Language Model
   │
   ▼
Validated Response
   │
   ▼
Frontend
   │
   ▼
User
```

---

# Technology Stack

## Frontend

- React
- Next.js
- TypeScript

## Backend

- Node.js
- Express

## Database

- PostgreSQL

## Storage

- Supabase Storage

## AI

- OpenAI
- Anthropic
- Local Models (future)

---

# Infrastructure

- Docker
- GitHub
- GitHub Actions
- Vercel
- Cloud Provider (future)

### Monitoring (Future)

- Prometheus
- Grafana

---

# Security

MentoreStudio dovrà garantire:

- Authentication
- Authorization
- Data Encryption
- Secure APIs
- Privacy by Design
- Secure File Upload
- Audit Logging

> **Stato di implementazione**:
>
> ✅ **Rate Limiting** — `rateLimiter.js`, protezione in-memory per IP su `POST /api/v1/ai/ask` (40 richieste/ora), `POST /api/chat` (20/ora) e `POST /api/generate` (15/ora), limiti configurabili via env var (`RATE_LIMIT_AI_ASK_PER_HOUR`, `RATE_LIMIT_CHAT_PER_HOUR`, `RATE_LIMIT_GENERATE_PER_HOUR`). Risposta `429` nel formato standard `{success, data, error}` con header `Retry-After`, gestita anche lato frontend con un messaggio dedicato meno allarmante. Limite noto: essendo in-memory e non condiviso tra istanze serverless concorrenti, non è una garanzia rigida sotto carico — mitiga abusi accidentali e costi fuori controllo, non un attore deliberato (fail-open per scelta esplicita in caso di errore interno del limiter).
>
> ✅ **XSS Sanitization** — `escapeHTML()` (contesto testo) ed `escapeAttr()` (contesto attributo HTML) in `public/index.html`, applicati sistematicamente a tutto il contenuto proveniente dagli agenti AI, dai file caricati dall'utente (nome file) e da `localStorage` prima di ogni inserimento via `innerHTML`. Convenzione documentata come commento accanto a `escapeHTML()`. Copertura verificata su ~44 punti d'iniezione (contenuto AI nei pannelli di studio, nomi file/lezione, attributi `data-search`/`data-term`/`data-*`, custom format, tooltip mappa mentale, share modal), confermata sia con analisi statica sia eseguendo le funzioni reali in browser con payload d'attacco (`<img onerror>`, `"><script>`).
>
> ⏳ **Non implementato**: Authentication, Authorization, Data Encryption, Audit Logging — dipendono dall'introduzione di un vero backend con gestione utenti (vedi Backend Layer); Secure File Upload è parziale (il nome file è sanificato lato rendering, ma non c'è validazione/scansione del contenuto del file lato server).

---

# Known Issues / TODO

Difetti e rischi noti, documentati qui oltre che come commenti nel codice, per non restare visibili solo a chi legge i sorgenti. Ultimo aggiornamento: novembre 2026, verificato sul codice di `main`.

## Aperti

### Nessuna persistenza né account

I dati delle lezioni vivono solo nel `localStorage` del browser: cambiando dispositivo o svuotando la cache si perdono. Non esistono database né autenticazione (vedi fasi 4-5 di `PRODUCT_ROADMAP.md`).

### Il progresso di studio non viene mai salvato

**Dove**: `public/index.html`, card della Libreria e `calculateStats()`.

`study.completedFlashcards` e `study.completedQuiz` vengono letti ma non scritti da nessuna parte, quindi ogni lezione risulta sempre "Nuovo" allo 0%. `submitQuizAnswer()` aggiorna solo un contatore di sessione. `renderStats()` esiste ma non è collegata a nessuna schermata.

### Rate limiter solo per istanza

**Dove**: `rateLimiter.js`.

Il contatore è in memoria e ogni istanza serverless ha il suo: protegge da abusi accidentali, non da uno deliberato. Per un uso pubblico con account servirà uno store condiviso (es. Upstash) e limiti per utente invece che per IP.

### Logica di generazione duplicata

**Dove**: `api/generate.js` e `agents/summaryAgent.js`.

Contengono la stessa chiamata e lo stesso prompt. L'upload usa `api/generate.js`; `summaryAgent.js` è raggiungibile solo via `/api/v1/ai/ask` con `agent:'summary'`, che la UI non usa. Un fix su uno dei due non arriva all'altro.

### Picker dark mode senza pulsante di accesso

**Dove**: `public/index.html`, `toggleDarkModeAdvanced()` → `createDarkModeOptions()` → `setDarkMode()`.

Nessun elemento della UI apre il selettore light/dark/true-black/auto. La parte di inizializzazione e schedulazione automatica (`initDarkMode`, `applyDarkMode`) invece è attiva a ogni caricamento: per questo la rimozione va valutata con cautela.

### Mind Map Agent non strutturato

`agents/mindMapAgent.js` produce ancora testo ASCII e non il JSON `{title, nodes, links}` previsto.

## Rischio accettato

### `image-size` (advisory GHSA-5p2g-fcmc-qvqq e GHSA-w3rx-r6r6-pgpr, severità alta)

`npm audit` segnala una vulnerabilità di denial of service (loop infinito nel parsing di immagini JXL/HEIF/ICNS) in `image-size`, dipendenza transitiva di `pptxgenjs`. La correzione esiste solo da `image-size` 2.0.3, ma `pptxgenjs` accetta soltanto la 1.x (anche la 4.0.1), quindi `npm audit fix` non può applicarla.

**Perché non è raggiungibile**: `api/generaPptx.js` non aggiunge mai immagini ai PowerPoint, quindi `image-size` non analizza mai contenuti forniti dall'utente. Forzare la versione 2.x con `overrides` rischierebbe di rompere la generazione PPTX per un rischio che non ci riguarda.

**Da riesaminare se**: l'app inizia a inserire immagini nei PowerPoint, oppure esce una versione di `pptxgenjs` che accetta `image-size` 2.x.

## Risolti

- **`flashcardExample` fuori contesto** (Tutor Agent): il prompt ora riceve anche nome e riassunto della lezione. Sistemato nella Sprint 3.
- **Crash di `showShareModal` con emoji** (`btoa()` fuori Latin-1): la condivisione è stata rimossa del tutto, perché nessun codice leggeva il link generato.
- **Pulsanti AI delle flashcard che non rispondevano**: il clic veniva intercettato dalla faccia anteriore durante il flip.
- **localStorage corrotto o pieno**: ora gestito senza bloccare l'app né perdere in silenzio il contenuto.
- **Timeout del Summary Agent**: `maxDuration` esplicito a 300 s e messaggio comprensibile in caso di 504.
- **Costi non protetti**: limiti sulla dimensione degli input, CORS ristretto al dominio dell'app e cap di 100 KB sul body (vedi `studiopro-slice-1-costi.md`).

---

# Scalability

L'architettura dovrà consentire:

- aggiunta di nuovi agenti
- supporto a nuovi modelli AI
- crescita del numero di utenti
- distribuzione su più server
- bilanciamento del carico
- espansione dei servizi

---

# Deployment

Architettura prevista

```text
Frontend
    │
Vercel
    │
Backend API
    │
Docker
    │
Cloud Server
    │
PostgreSQL
    │
Storage
```

Future deployments may support multiple cloud providers and self-hosted installations.

---

# Future Architecture

Possibili evoluzioni:

- Mobile App
- Voice Assistant
- Offline AI
- Plugin System
- Community Platform
- Marketplace
- LMS Integrations
- Multi-language Support
- Public API
- Plugin SDK
- Enterprise Edition

---

## Project Status

🔄 In Development

### Current Phase

- ✅ Project Vision
- ✅ Product Roadmap
- 🟡 System Architecture
- ⏳ AI Agents
- ⏳ API Design
- ⏳ Database Design
- ⏳ Frontend Development
- 🔄 Backend Development — AI Orchestrator e Multi-Agent System implementati; Backend Express, Database e Auth non ancora avviati

---

## Decision Log

### Version 1.0

- Created the first System Architecture document.
- Defined the layered architecture.
- Introduced the AI Orchestrator.
- Designed the Multi-Agent System.
- Defined the core platform components.
- Introduced the Data Layer architecture.
- Defined the infrastructure and deployment model.
- Added architecture principles and deployment strategy.

### Version 1.1

- Implemented the AI Orchestrator and 4 of the 5 Multi-Agent System agents (Tutor, Summary, Quiz, Mind Map).
- Exposed the Orchestrator through a first versioned endpoint, `POST /api/v1/ai/ask`.
- Migrated most of the frontend's AI features to call this endpoint instead of the legacy, unversioned `/api/chat`.
- Planner Agent, the Express backend, the database layer, authentication, file storage and notifications remain unimplemented.

### Version 1.2

- Implemented rate limiting (`rateLimiter.js`) on `/api/v1/ai/ask`, `/api/chat` and `/api/generate`, with a standard `429` response and frontend handling.
- Implemented systematic XSS sanitization (`escapeHTML()`/`escapeAttr()`) across ~44 injection points covering AI-generated content, user file names and localStorage-derived data in `public/index.html`.
- Added a "Known Issues / TODO" section documenting two defects found during this work: off-topic examples in the Tutor Agent's `flashcardExample` task, and a `showShareModal` crash on non-Latin-1 characters.
- Authentication, Authorization, Data Encryption and Audit Logging remain unimplemented.

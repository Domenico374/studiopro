# 🎓 StudioPro

## System Architecture

> **Version:** 1.1
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
- Scalability
- Deployment
- Future Architecture
- Project Status
- Decision Log

---

# Architecture Overview

StudioPro sarà progettato come una piattaforma modulare composta da componenti indipendenti che comunicano attraverso API ben definite.

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

L'architettura di StudioPro sarà guidata dai seguenti principi.

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
                              StudioPro

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

L'AI Layer rappresenta il cuore intelligente di StudioPro.

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

StudioPro utilizzerà un ecosistema di agenti AI specializzati.

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

StudioPro dovrà garantire:

- Authentication
- Authorization
- Data Encryption
- Secure APIs
- Privacy by Design
- Secure File Upload
- Audit Logging

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

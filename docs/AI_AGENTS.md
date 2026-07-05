# 🎓 StudioPro

## AI Agents

> **Version:** 1.1
>
> **Last updated:** July 2026
>
> **Status:** Draft — Partially Implemented

## Contents

- Agents Overview
- Implementation Status
- Agent Design Principles
- AI Orchestrator
- Agent Selection Strategy
- Agent Lifecycle
- Core Agents
- Agent Summary
- Agent Collaboration
- Agent Communication
- Example Workflows
- Future Agents
- Project Status
- Decision Log

---

# Agents Overview

StudioPro utilizzerà un ecosistema di agenti AI specializzati progettati per collaborare durante il processo di apprendimento.

Ogni agente sarà responsabile di uno specifico dominio funzionale e lavorerà in coordinamento con gli altri attraverso l'AI Orchestrator.

L'utente interagirà esclusivamente con StudioPro. Sarà il sistema a selezionare automaticamente gli agenti più adatti in base alla richiesta, al contesto della conversazione e agli obiettivi di apprendimento.

---

# Implementation Status

Una prima versione dell'architettura descritta in questo documento è stata implementata.

| Componente | Stato | Note |
|---|---|---|
| AI Orchestrator | ✅ Implementato | `orchestrator.js`, esposto via `POST /api/v1/ai/ask` (vedi `docs/API_DESIGN.md`) |
| Tutor Agent | ✅ Implementato | `agents/tutorAgent.js` — task: `chat`, `explainHighlight`, `glossaryExample`, `flashcardExplain`, `flashcardExample`, `conceptAnalysis` |
| Summary Agent | ✅ Implementato | `agents/summaryAgent.js` — genera riassunto, glossario, mind map, timeline, flashcard e quiz in un'unica chiamata |
| Quiz Agent | ✅ Implementato | `agents/quizAgent.js` — task: `essayQuestions`, `flashcardEssay` |
| Mind Map Agent | ✅ Implementato | `agents/mindMapAgent.js` — mappa mentale testuale gerarchica |
| Planner Agent | ⏳ Non implementato | Nessun modulo in `agents/`; le richieste che lo richiederebbero (tabella sotto) ricadono su Tutor Agent |
| Selezione automatica degli agenti | 🔄 Parziale | Implementata in `orchestrator.js` (keyword matching) e utilizzabile direttamente su `/api/v1/ai/ask`; il pannello di chat del frontend forza però sempre `agent: "tutor"` per evitare instradamenti errati — la selezione automatica end-to-end nella UI resta da completare |
| Override espliciti `agent` / `task` | ✅ Implementato | Campi opzionali nel body di `/api/v1/ai/ask` che forzano un agente/task specifico, bypassando la selezione automatica — usati da quasi tutte le funzioni AI del frontend |
| Task `freeform` (Personalizza) | ⏳ Pianificato | La sezione "Personalizza" del frontend (slide, schema, tabella, formato libero) non corrisponde a nessun agente esistente e resta sull'endpoint legacy `/api/chat` |
| Frontend collegato all'Orchestrator | 🔄 Parziale | 7 delle 9 funzionalità AI del frontend sono migrate su `/api/v1/ai/ask`; `generateCustomFormat` resta su `/api/chat` |

---

# Agent Design Principles

Tutti gli agenti seguiranno gli stessi principi progettuali.

- Single Responsibility
- Collaboration First
- AI Orchestrator Coordination
- Explainability
- Context Awareness
- Stateless Execution
- Extensibility
- Reusability

Ogni agente svolgerà un solo compito specifico, lasciando all'AI Orchestrator il coordinamento dell'intero workflow.

---

# AI Orchestrator

L'AI Orchestrator rappresenta il cervello operativo dell'intero sistema.

Responsabilità:

- interpretare la richiesta dello studente
- identificare l'obiettivo della conversazione
- selezionare uno o più agenti
- coordinare il workflow
- condividere il contesto tra gli agenti
- validare le risposte
- costruire la risposta finale

L'Orchestrator costituisce l'unico punto di comunicazione tra l'utente e gli agenti AI.

> ✅ **Implementato**: `orchestrator.js` interpreta la richiesta (`selectAgents`/`resolveAgents`), esegue gli agenti condividendo un unico oggetto di contesto, valida ogni risposta (`validateAgentResult`) e costruisce la risposta finale aggregata (`answer` + `agents_used`). Esposto via `POST /api/v1/ai/ask`.

---

# Agent Selection Strategy

L'AI Orchestrator selezionerà dinamicamente gli agenti più adatti in base alla richiesta dello studente.

| Richiesta dello studente | Agenti coinvolti |
|---------------------------|------------------|
| Spiegami un argomento | Tutor Agent |
| Fammi un riassunto | Summary Agent |
| Interrogami | Quiz Agent |
| Organizza il mio studio | Planner Agent |
| Crea una mappa concettuale | Mind Map Agent |
| Ho un esame domani | Planner + Summary + Tutor + Quiz |

L'Orchestrator potrà coinvolgere uno o più agenti nello stesso workflow.

> ✅ **Implementato**: la tabella sopra è realizzata tramite keyword matching in `orchestrator.js` (`SELECTION_RULES`). Poiché Planner Agent non esiste ancora, le richieste che lo coinvolgerebbero cadono su Tutor Agent (caso "Organizza il mio studio") o vengono eseguite senza di lui (caso "Ho un esame domani" → Summary + Tutor + Quiz).
>
> È inoltre disponibile un **override esplicito** (`agent`/`task` nel body della richiesta) che bypassa questa selezione automatica e forza un agente/task specifico — usato oggi dal pannello di chat del frontend per garantire sempre il Tutor Agent, e dalla maggior parte delle altre funzionalità AI del frontend per instradare direttamente al task corretto.

---

# Agent Lifecycle

Ogni richiesta seguirà il medesimo ciclo di elaborazione.

```text
User Request
      │
      ▼
AI Orchestrator
      │
      ▼
Agent Selection
      │
      ▼
Agent Execution
      │
      ▼
Response Validation
      │
      ▼
Final Response
```

---

# Core Agents

## 🎓 Tutor Agent

### Mission

Aiutare lo studente a comprendere un argomento.

### Responsibilities

- spiegare concetti
- fornire esempi
- adattare il linguaggio
- rispondere alle domande

### Input

- domanda
- documento
- cronologia
- livello dello studente

### Output

- spiegazione
- esempi
- approfondimenti
- suggerimenti

### Implementation

✅ `agents/tutorAgent.js` — task disponibili: `chat` (chat principale), `explainHighlight`, `glossaryExample`, `flashcardExplain`, `flashcardExample`, `conceptAnalysis`.

---

## 📄 Summary Agent

### Mission

Trasformare documenti lunghi in contenuti sintetici.

### Responsibilities

- creare riassunti
- estrarre concetti
- identificare parole chiave
- produrre versioni brevi o dettagliate

### Input

- documento
- testo
- richiesta

### Output

- riassunto
- schema
- punti chiave

### Implementation

✅ `agents/summaryAgent.js` — un'unica chiamata produce riassunto breve/lungo, punti salienti, glossario, mind map, timeline, flashcard e quiz a scelta multipla.

---

## ❓ Quiz Agent

### Mission

Verificare la preparazione dello studente.

### Responsibilities

- generare quiz
- creare domande aperte
- correggere risposte
- spiegare gli errori

### Input

- argomento
- documento
- livello

### Output

- quiz
- correzione
- feedback

### Implementation

🔄 `agents/quizAgent.js` — task disponibili: `essayQuestions` (domande da saggio/esame), `flashcardEssay` (domanda da saggio a partire da una singola flashcard). La generazione del quiz a scelta multipla vive invece in Summary Agent; "correggere risposte" (dalla Mission sopra) non è ancora implementato: la correzione del quiz è oggi puramente client-side, per confronto con l'indice `correct` già presente nei dati.

---

## 📅 Planner Agent

### Mission

Organizzare il percorso di studio.

### Responsibilities

- creare piani di studio
- suddividere gli argomenti
- pianificare il ripasso
- suggerire priorità

### Input

- data esame
- tempo disponibile
- argomenti

### Output

- calendario
- piano di studio
- attività

### Implementation

⏳ Non implementato. Nessun modulo in `agents/`; `orchestrator.js` non ha un `plannerAgent` da selezionare.

---

## 🧠 Mind Map Agent

### Mission

Visualizzare la conoscenza.

### Responsibilities

- creare mappe concettuali
- collegare concetti
- definire gerarchie
- costruire relazioni

### Input

- documento
- argomento

### Output

- struttura della mappa
- nodi
- collegamenti

### Implementation

✅ `agents/mindMapAgent.js` — genera una mappa mentale testuale gerarchica (struttura ASCII con rami e sotto-concetti), non un task parametrizzato come gli altri agenti.

---

# Agent Summary

| Agent | Mission | Input | Output |
|--------|---------|--------|--------|
| Tutor Agent | Comprendere un argomento | Domande, documenti | Spiegazioni |
| Summary Agent | Sintetizzare contenuti | Documenti | Riassunti |
| Quiz Agent | Verificare l'apprendimento | Argomenti | Quiz e feedback |
| Planner Agent | Organizzare lo studio | Esami e tempo disponibile | Piano di studio |
| Mind Map Agent | Visualizzare i concetti | Documenti | Mappe concettuali |

---

# Agent Collaboration

Gli agenti non comunicano direttamente con l'utente.

Ogni collaborazione viene coordinata esclusivamente dall'AI Orchestrator.

```text
                 AI Orchestrator

        ┌────────────┬─────────────┬─────────────┐
        ▼            ▼             ▼             ▼
   Tutor Agent  Summary Agent  Quiz Agent  Planner Agent
        │            │             │             │
        └────────────┴──────┬──────┴─────────────┘
                            ▼
                     Mind Map Agent
```

---

# Agent Communication

Gli agenti comunicano esclusivamente attraverso l'AI Orchestrator.

Gli agenti:

- non comunicano direttamente tra loro
- non mantengono stato condiviso
- ricevono il contesto dall'Orchestrator
- restituiscono risultati strutturati
- possono essere sostituiti senza modificare il resto del sistema

Questo approccio garantisce modularità, manutenibilità ed estensibilità dell'intera piattaforma.

---

# Example Workflows

## Workflow 1 — Studio di un documento

```text
Upload PDF
      │
      ▼
Summary Agent
      │
      ▼
Tutor Agent
      │
      ▼
Quiz Agent
      │
      ▼
Learning Session
```

---

## Workflow 2 — Preparazione di un esame

```text
Exam Date
      │
      ▼
Planner Agent
      │
      ▼
Summary Agent
      │
      ▼
Tutor Agent
      │
      ▼
Quiz Agent
      │
      ▼
Study Plan
```

---

## Workflow 3 — Comprensione di un concetto

```text
Student Question
      │
      ▼
Tutor Agent
      │
      ▼
Mind Map Agent
      │
      ▼
Visual Explanation
```

---

# Future Agents

Il sistema potrà essere esteso con nuovi agenti.

## Learning Agents

- Flashcard Agent
- Revision Agent
- Progress Agent
- Motivation Agent

## Research Agents

- Research Agent
- Citation Agent

## Productivity Agents

- Writing Agent
- Translation Agent
- Coding Agent

---

## Project Status

🔄 In Development

### Documentation

- ✅ Project Vision
- ✅ Product Roadmap
- ✅ System Architecture
- ✅ AI Agents

### Development

- ⏳ API Design
- ⏳ Database Design
- ⏳ Frontend Development
- 🔄 Backend Development — AI Orchestrator, endpoint `/api/v1/ai/ask` e 4 dei 5 agenti implementati

---

## Decision Log

### Version 1.0

- Created the AI Agents specification.
- Defined the AI Orchestrator.
- Defined the core AI agents.
- Introduced the agent lifecycle.
- Defined the agent selection strategy.
- Introduced collaboration workflows.
- Defined the communication model between agents.

### Version 1.1

- Implemented the AI Orchestrator (`orchestrator.js`), exposed via `POST /api/v1/ai/ask`.
- Implemented Tutor Agent, Summary Agent, Quiz Agent and Mind Map Agent (`agents/`).
- Implemented explicit `agent`/`task` override fields on the Orchestrator endpoint, alongside keyword-based automatic selection.
- Migrated 7 of the 9 frontend AI features to the Orchestrator endpoint.
- Planner Agent, full automatic selection in the chat panel, a `freeform` task for the "Personalizza" feature, and the Database layer remain not implemented.

# 🎓 StudioPro

## API Design

> **Version:** 1.0
>
> **Last updated:** July 2026
>
> **Status:** Draft

## Contents

- API Overview
- Design Principles
- API Architecture
- Authentication
- Core Endpoints
- User APIs
- Document APIs
- Conversation APIs
- AI Agent APIs
- Study Session APIs
- Generated Content APIs
- Error Handling
- Security
- Rate Limiting
- Future APIs
- Project Status
- Decision Log

---

# API Overview

Le API di StudioPro rappresentano il punto di comunicazione tra frontend, backend, database e sistema AI.

Ogni funzionalità principale della piattaforma dovrà essere esposta attraverso endpoint chiari, sicuri e coerenti.

Le API permetteranno allo studente di autenticarsi, caricare documenti, avviare conversazioni, interagire con gli agenti AI, generare contenuti e recuperare il proprio percorso di studio.

---

# Design Principles

Le API di StudioPro seguiranno questi principi:

- REST-first Design
- Clear Endpoint Naming
- JSON Responses
- Authentication Required
- Security by Design
- Versioned APIs
- Consistent Error Handling
- Modular API Structure
- Future GraphQL Support

---

# API Architecture

```text
Frontend
   │
   ▼
API Gateway
   │
   ▼
Backend API
   │
   ├── Authentication Service
   ├── Document Service
   ├── Conversation Service
   ├── AI Orchestrator
   ├── Study Service
   └── Generated Content Service
```

---

# Authentication

Tutte le API protette richiederanno autenticazione.

Metodo previsto:

```text
Authorization: Bearer <token>
```

Possibili provider futuri:

- Email / Password
- Google Login
- GitHub Login
- Microsoft Login

---

# Core Endpoints

## Health Check

```http
GET /api/health
```

Risposta:

```json
{
  "status": "ok",
  "service": "StudioPro API"
}
```

---

# User APIs

## Get Current User

```http
GET /api/users/me
```

Descrizione:

Restituisce le informazioni dell'utente autenticato.

---

## Update User Profile

```http
PUT /api/users/me
```

Body:

```json
{
  "full_name": "Mario Rossi"
}
```

---

# Document APIs

## Upload Document

```http
POST /api/documents
```

Descrizione:

Carica un documento nello storage e registra i metadati nel database.

---

## Get User Documents

```http
GET /api/documents
```

Descrizione:

Restituisce i documenti caricati dall'utente.

---

## Get Document Detail

```http
GET /api/documents/{document_id}
```

Descrizione:

Restituisce i dettagli di un documento.

---

## Delete Document

```http
DELETE /api/documents/{document_id}
```

Descrizione:

Elimina o archivia un documento.

---

# Conversation APIs

## Create Conversation

```http
POST /api/conversations
```

Body:

```json
{
  "title": "Ripasso storia",
  "document_id": "uuid"
}
```

---

## Get Conversations

```http
GET /api/conversations
```

---

## Get Conversation Messages

```http
GET /api/conversations/{conversation_id}/messages
```

---

## Send Message

```http
POST /api/conversations/{conversation_id}/messages
```

Body:

```json
{
  "message": "Spiegami questo capitolo"
}
```

---

# AI Agent APIs

## Ask StudioPro

```http
POST /api/ai/ask
```

Descrizione:

Endpoint principale per interagire con StudioPro.

Body:

```json
{
  "message": "Ho l'esame domani, aiutami a ripassare",
  "context": {
    "document_id": "uuid",
    "study_level": "university"
  }
}
```

Risposta:

```json
{
  "answer": "Ecco un piano rapido di ripasso...",
  "agents_used": ["Planner Agent", "Summary Agent", "Quiz Agent"]
}
```

---

## Generate Summary

```http
POST /api/ai/summary
```

Body:

```json
{
  "document_id": "uuid",
  "type": "short"
}
```

---

## Generate Quiz

```http
POST /api/ai/quiz
```

Body:

```json
{
  "document_id": "uuid",
  "difficulty": "medium",
  "questions": 10
}
```

---

## Generate Mind Map

```http
POST /api/ai/mind-map
```

Body:

```json
{
  "document_id": "uuid"
}
```

---

# Study Session APIs

## Create Study Session

```http
POST /api/study-sessions
```

Body:

```json
{
  "title": "Ripasso diritto privato",
  "document_id": "uuid"
}
```

---

## Get Study Sessions

```http
GET /api/study-sessions
```

---

## Get Study Session Detail

```http
GET /api/study-sessions/{session_id}
```

---

# Generated Content APIs

## Get Generated Content

```http
GET /api/generated-content
```

---

## Get Generated Content Detail

```http
GET /api/generated-content/{content_id}
```

---

## Delete Generated Content

```http
DELETE /api/generated-content/{content_id}
```

---

# Error Handling

Le API restituiranno errori in formato coerente.

Esempio:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found",
    "status": 404
  }
}
```

Codici principali:

- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 429 Too Many Requests
- 500 Internal Server Error

---

# Security

Le API dovranno garantire:

- autenticazione obbligatoria per endpoint privati
- validazione degli input
- protezione dei file caricati
- controllo dei permessi utente
- rate limiting
- logging delle operazioni sensibili

---

# Rate Limiting

Le API AI potranno avere limiti specifici per evitare abusi e controllare i costi.

Esempio:

| Endpoint | Limit |
|----------|-------|
| /api/ai/ask | 30 requests / hour |
| /api/ai/summary | 20 requests / hour |
| /api/ai/quiz | 20 requests / hour |

---

# Future APIs

Possibili estensioni future:

- Public API
- Plugin API
- Mobile API
- Webhook API
- LMS Integration API
- Analytics API
- Admin API

---

## Project Status

🟢 Planning

### Documentation

- ✅ Project Vision
- ✅ Product Roadmap
- ✅ System Architecture
- ✅ AI Agents
- ✅ Database Design
- 🟡 API Design

### Development

- ⏳ Frontend Development
- ⏳ Backend Development

---

## Decision Log

### Version 1.0

- Created the API Design document.
- Defined the main API structure.
- Introduced authentication model.
- Defined core API endpoints.
- Designed AI Agent endpoints.
- Added error handling and rate limiting strategy.

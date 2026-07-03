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
- API Versioning
- API Architecture
- Standard Response Format
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

# API Versioning

Le API seguiranno una struttura versionata.

```http
/api/v1/...
```

La prima versione stabile utilizzerà `/api/v1`.

Le future versioni potranno introdurre nuovi endpoint senza rompere la compatibilità con le versioni precedenti.

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

# Standard Response Format

Le risposte API seguiranno un formato coerente.

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

In caso di errore:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document not found",
    "status": 404
  }
}
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
GET /api/v1/health
```

Risposta:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "StudioPro API"
  },
  "error": null
}
```

---

# User APIs

## Get Current User

```http
GET /api/v1/users/me
```

Descrizione:

Restituisce le informazioni dell'utente autenticato.

---

## Update User Profile

```http
PUT /api/v1/users/me
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
POST /api/v1/documents
```

Descrizione:

Carica un documento nello storage e registra i metadati nel database.

---

## Process Document

```http
POST /api/v1/documents/{document_id}/process
```

Descrizione:

Estrae testo, genera embeddings e prepara il documento per l'utilizzo con gli agenti AI.

---

## Get User Documents

```http
GET /api/v1/documents
```

Descrizione:

Restituisce i documenti caricati dall'utente.

---

## Get Document Detail

```http
GET /api/v1/documents/{document_id}
```

Descrizione:

Restituisce i dettagli di un documento.

---

## Delete Document

```http
DELETE /api/v1/documents/{document_id}
```

Descrizione:

Elimina o archivia un documento.

---

# Conversation APIs

## Create Conversation

```http
POST /api/v1/conversations
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
GET /api/v1/conversations
```

---

## Get Conversation Messages

```http
GET /api/v1/conversations/{conversation_id}/messages
```

---

## Send Message

```http
POST /api/v1/conversations/{conversation_id}/messages
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
POST /api/v1/ai/ask
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
  "success": true,
  "data": {
    "answer": "Ecco un piano rapido di ripasso...",
    "agents_used": ["Planner Agent", "Summary Agent", "Quiz Agent"]
  },
  "error": null
}
```

---

## Generate Summary

```http
POST /api/v1/ai/summary
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
POST /api/v1/ai/quiz
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
POST /api/v1/ai/mind-map
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
POST /api/v1/study-sessions
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
GET /api/v1/study-sessions
```

---

## Get Study Session Detail

```http
GET /api/v1/study-sessions/{session_id}
```

---

# Generated Content APIs

## Get Generated Content

```http
GET /api/v1/generated-content
```

---

## Get Generated Content Detail

```http
GET /api/v1/generated-content/{content_id}
```

---

## Delete Generated Content

```http
DELETE /api/v1/generated-content/{content_id}
```

---

# Error Handling

Le API restituiranno errori in formato coerente.

Esempio:

```json
{
  "success": false,
  "data": null,
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
| /api/v1/ai/ask | 30 requests / hour |
| /api/v1/ai/summary | 20 requests / hour |
| /api/v1/ai/quiz | 20 requests / hour |

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
- ✅ API Design

### Development

- ⏳ Frontend Development
- ⏳ Backend Development

---

## Decision Log

### Version 1.0

- Created the API Design document.
- Defined the main API structure.
- Introduced API versioning.
- Defined the standard response format.
- Introduced authentication model.
- Defined core API endpoints.
- Designed AI Agent endpoints.
- Added document processing endpoint.
- Added error handling and rate limiting strategy.

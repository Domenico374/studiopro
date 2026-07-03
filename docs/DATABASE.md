# 🎓 StudioPro

## Database Design

> **Version:** 1.0
>
> **Last updated:** July 2026
>
> **Status:** Draft

## Contents

- Database Overview
- Design Principles
- Database Architecture
- Main Entities
- Entity Relationships
- Table Specifications
- Data Flow
- Storage Strategy
- Security
- Scalability
- Future Database
- Project Status
- Decision Log

---

# Database Overview

Il database di StudioPro rappresenta il centro di gestione di tutte le informazioni della piattaforma.

Conserverà i dati relativi agli utenti, ai documenti, alle sessioni di studio, alle conversazioni con gli agenti AI e ai contenuti generati durante il percorso di apprendimento.

L'obiettivo è costruire una struttura semplice, modulare, sicura ed estendibile, capace di supportare l'evoluzione futura della piattaforma senza richiedere modifiche sostanziali al modello dati.

---

# Design Principles

Il database seguirà questi principi fondamentali.

- Data Integrity
- Scalability
- Normalization
- Security by Design
- Performance
- Extensibility
- Consistency
- Auditability

---

# Database Architecture

StudioPro utilizzerà un database relazionale come archivio principale.

Accanto ad esso saranno presenti componenti dedicate alla gestione dei documenti, della memoria degli agenti AI e delle informazioni utilizzate durante il processo di apprendimento.

```text
                        StudioPro

                     PostgreSQL
                          │
 ┌──────────────┬──────────────┬──────────────┐
 ▼              ▼              ▼
Users      Documents     Study Sessions
 │              │              │
 ▼              ▼              ▼
Conversations Generated Content AI Memory
 │
 ▼
Messages
                          │
                          ▼
                  Vector Database
                          │
                          ▼
                  AI Orchestrator
```

---

# Main Entities

Le principali entità del sistema saranno:

- Users
- Documents
- Conversations
- Messages
- Study Sessions
- Study Plans
- Quizzes
- Mind Maps
- Flashcards
- Generated Content
- AI Memory

---

# Entity Relationships

```text
User
 │
 ├── Documents
 ├── Conversations
 ├── Study Sessions
 └── Study Plans

Conversation
 │
 └── Messages

Study Session
 │
 ├── Quizzes
 ├── Mind Maps
 ├── Flashcards
 └── Generated Content
```

---

# Table Specifications

## Users

### Purpose

Memorizza le informazioni degli utenti registrati.

| Field | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| email | VARCHAR | User email |
| password_hash | VARCHAR | Password cifrata |
| full_name | VARCHAR | Nome completo |
| role | VARCHAR | Student / Teacher / Admin |
| created_at | TIMESTAMP | Data di creazione |
| updated_at | TIMESTAMP | Ultima modifica |

### Relationships

- One User → Many Documents
- One User → Many Conversations
- One User → Many Study Sessions

---

## Documents

### Purpose

Memorizza i documenti caricati dagli utenti.

| Field | Type | Description |
|--------|------|-------------|
| id | UUID | Primary Key |
| user_id | UUID | Proprietario |
| filename | VARCHAR | Nome originale del file |
| storage_url | TEXT | Percorso nello storage |
| file_type | VARCHAR | PDF, DOCX, TXT... |
| created_at | TIMESTAMP | Data di upload |

### Relationships

- Many Documents → One User
- One Document → Many Conversations

---

## Conversations

### Purpose

Memorizza le conversazioni tra lo studente e StudioPro.

### Future Fields

Will be defined during API Design.

### Relationships

- One Conversation → Many Messages

---

## Messages

### Purpose

Memorizza ogni messaggio appartenente a una conversazione.

### Future Fields

Will be defined during API Design.

---

## Study Sessions

### Purpose

Memorizza ogni sessione di studio effettuata dallo studente.

### Future Fields

Will be defined during API Design.

---

## Study Plans

### Purpose

Memorizza i piani di studio creati dal Planner Agent.

### Future Fields

Will be defined during API Design.

---

## Quizzes

### Purpose

Memorizza quiz, risultati e statistiche.

### Future Fields

Will be defined during API Design.

---

## Mind Maps

### Purpose

Memorizza le mappe concettuali generate.

### Future Fields

Will be defined during API Design.

---

## Flashcards

### Purpose

Memorizza le flashcard create durante lo studio.

### Future Fields

Will be defined during API Design.

---

## Generated Content

### Purpose

Memorizza tutti i contenuti generati dagli agenti AI.

### Future Fields

Will be defined during API Design.

---

## AI Memory

### Purpose

Memorizza il contesto condiviso utilizzato dagli agenti AI.

### Future Fields

Will be defined during API Design.

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
Database
   │
   ▼
AI Orchestrator
   │
   ▼
AI Agents
   │
   ▼
Generated Content
   │
   ▼
Database
   │
   ▼
Frontend
   │
   ▼
User
```

---

# Storage Strategy

StudioPro utilizzerà differenti sistemi di archiviazione.

| Component | Storage |
|-----------|---------|
| Structured Data | PostgreSQL |
| Documents | Object Storage |
| AI Embeddings | Vector Database |
| Temporary Data | Cache (Future) |

---

# Security

Il database dovrà garantire:

- Authentication
- Authorization
- Encryption at Rest
- Encryption in Transit
- Secure File Access
- Audit Logging
- Automatic Backup

---

# Scalability

L'architettura dovrà supportare:

- milioni di utenti
- milioni di documenti
- milioni di conversazioni
- nuovi agenti AI
- nuovi tipi di contenuto
- nuovi provider AI

---

# Future Database

Possibili evoluzioni future:

- Multi-tenant Architecture
- Distributed Storage
- Database Sharding
- Event Store
- Analytics Database
- Data Warehouse

---

## Project Status

🟢 Planning

### Documentation

- ✅ Project Vision
- ✅ Product Roadmap
- ✅ System Architecture
- ✅ AI Agents
- 🟡 Database Design

### Development

- ⏳ API Design
- ⏳ Frontend Development
- ⏳ Backend Development

---

## Decision Log

### Version 1.0

- Created the Database Design document.
- Defined the database architecture.
- Identified the main entities.
- Defined the entity relationships.
- Introduced the first table specifications.
- Defined the storage strategy.
- Designed the database scalability model.
- Prepared the database for future API implementation.

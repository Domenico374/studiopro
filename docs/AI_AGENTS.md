# 🎓 StudioPro

## AI Agents

> **Version:** 1.0
>
> **Last updated:** July 2026
>
> **Status:** Draft

## Contents

- Agents Overview
- Agent Design Principles
- AI Orchestrator
- Core Agents
- Agent Collaboration
- Example Workflows
- Future Agents
- Project Status
- Decision Log

---

# Agents Overview

StudioPro utilizzerà un sistema di agenti AI specializzati per supportare lo studente durante il percorso di apprendimento.

Ogni agente avrà un compito specifico e collaborerà con gli altri attraverso l'AI Orchestrator.

L'utente non dovrà scegliere manualmente quale agente usare: parlerà con StudioPro, mentre il sistema deciderà quale agente coinvolgere in base alla richiesta.

---

# Agent Design Principles

Gli agenti di StudioPro seguiranno questi principi:

- ogni agente ha una responsabilità chiara
- gli agenti non lavorano in modo isolato
- l'AI Orchestrator coordina il flusso
- ogni risposta deve aiutare lo studente a comprendere meglio
- gli agenti devono produrre output semplici, utili e verificabili
- il sistema deve poter aggiungere nuovi agenti nel tempo

---

# AI Orchestrator

L'AI Orchestrator è il componente che coordina gli agenti AI.

Responsabilità:

- interpretare la richiesta dello studente
- selezionare l'agente più adatto
- coordinare più agenti quando necessario
- gestire il contesto della conversazione
- validare la risposta finale
- restituire all'utente un risultato chiaro e coerente

---

# Core Agents

## Tutor Agent

Missione:

Aiutare lo studente a comprendere un argomento.

Responsabilità:

- spiegare concetti complessi
- fornire esempi
- rispondere a domande
- adattare il linguaggio al livello dello studente

Input:

- domanda dello studente
- materia
- livello di studio
- eventuali documenti caricati

Output:

- spiegazione chiara
- esempi
- passaggi logici
- eventuali suggerimenti di ripasso

---

## Summary Agent

Missione:

Trasformare testi e documenti lunghi in contenuti più semplici da studiare.

Responsabilità:

- creare riassunti
- estrarre concetti chiave
- organizzare le informazioni
- produrre versioni brevi o dettagliate

Input:

- documento
- testo
- richiesta dello studente

Output:

- riassunto
- punti chiave
- schema sintetico

---

## Quiz Agent

Missione:

Aiutare lo studente a verificare la propria preparazione.

Responsabilità:

- generare quiz
- creare domande aperte
- proporre domande a risposta multipla
- correggere le risposte
- spiegare gli errori

Input:

- argomento
- documento
- livello di difficoltà

Output:

- quiz
- soluzioni
- spiegazioni
- feedback

---

## Planner Agent

Missione:

Aiutare lo studente a organizzare lo studio.

Responsabilità:

- creare piani di studio
- dividere gli argomenti nel tempo
- suggerire priorità
- proporre sessioni di ripasso

Input:

- data dell'esame
- tempo disponibile
- argomenti da studiare
- livello di preparazione

Output:

- piano di studio
- attività giornaliere
- priorità
- suggerimenti di ripasso

---

## Mind Map Agent

Missione:

Aiutare lo studente a visualizzare collegamenti tra concetti.

Responsabilità:

- creare mappe concettuali
- collegare argomenti
- evidenziare relazioni
- organizzare le informazioni in modo visuale

Input:

- argomento
- documento
- concetti principali

Output:

- struttura della mappa
- nodi principali
- collegamenti
- gerarchia dei concetti

---

# Agent Collaboration

Gli agenti potranno collaborare tra loro attraverso l'AI Orchestrator.

Esempio:

```text
Studente:
"Ho l'esame domani, aiutami a ripassare."

AI Orchestrator
      ↓
Planner Agent
      ↓
Summary Agent
      ↓
Tutor Agent
      ↓
Quiz Agent
      ↓
Risposta finale allo studente

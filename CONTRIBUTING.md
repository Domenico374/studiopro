# 🤝 Guida per chi contribuisce

Grazie per l'interesse in **StudioPro**! Segnalazioni, idee e correzioni sono benvenute.

## Prima di tutto: provarla e segnalare

Il contributo più utile in questa fase è **usare l'app** e dirci cosa non va. Apri una
[segnalazione](https://github.com/Domenico374/studiopro/issues/new/choose) indicando
browser, passaggi per riprodurre il problema e, se puoi, uno screenshot.

## Contribuire al codice

1. Fai un fork e clona il repository:
   ```bash
   git clone https://github.com/TUO_USERNAME/studiopro.git
   cd studiopro
   npm ci
   ```
2. Crea un branch dedicato: `git checkout -b fix/nome-breve`
3. Fai la modifica **piccola e mirata** (una cosa per volta).
4. Esegui i test: `npm test`. Devono passare tutti.
5. Apri una Pull Request verso `main`. La CI (GitHub Actions) esegue gli stessi test.

## Regole del progetto

- **Niente chiamate reali all'AI nei test.** Ogni chiamata a OpenAI costa denaro: nei test si
  chiamano gli handler direttamente con client e risposte finte (vedi `tests/`).
- **Mai registrare contenuti degli utenti** nei log (testi dei documenti, messaggi, risposte
  dell'AI). Si registrano solo dati tecnici (vedi `usageLogger.js`).
- **Non aggirare le protezioni sui costi**: limiti di dimensione degli input
  (`orchestrator.js`), tetto sulla richiesta e interruttore `AI_DISABLED`
  (`requestGuards.js`), rate limit (`rateLimiter.js`).
- **Contenuto dell'AI nella pagina:** mai inserirlo con `innerHTML` senza passare da
  `escapeHTML()` / `escapeAttr()`.
- **`public/index.html` resta un file unico**: è una scelta di progetto, non un difetto. Non
  spezzarlo senza averne prima discusso.
- **Nessuna nuova dipendenza** senza una buona ragione: oggi sono solo due.
- **Non committare mai `.env`** né chiavi API. Usa `.env.example` come modello.

## Messaggi di commit

Descrivi **cosa cambia e perché**, in italiano, a modo imperativo, con una prima riga breve:

```text
Corregge il conteggio del punteggio nel quiz

L'esito delle domande non veniva registrato perché il pulsante "Conferma"
spariva appena si cliccava un'opzione; i filtri risultavano sempre vuoti.
```

## Checklist per la Pull Request

- [ ] `npm test` passa
- [ ] Nessuna chiamata reale all'AI aggiunta ai test
- [ ] Niente `.env`, chiavi o contenuti degli utenti nel diff
- [ ] La documentazione è aggiornata se cambia il comportamento visibile

Grazie! ❤️

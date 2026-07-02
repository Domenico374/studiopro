# StudioPro – Studia intelligente

**Il tuo mentore personale per lo studio intelligente**

## ✨ Funzionalità principali

### 📚 Gestione materiali di studio
- Caricamento multiplo di file (PDF, DOCX, TXT, MD, immagini)
- Drag & drop intuitivo
- Anteprima immediata dei contenuti
- Estrazione automatica del testo

### 🎯 Analisi intelligente
- **Riassunti automatici** - Sintesi dei concetti chiave
- **Punti salienti** - Identificazione delle informazioni più importanti
- **To-Do automatici** - Estrazione di compiti e attività
- **Tag intelligenti** - Categorizzazione automatica dei contenuti

### 📋 Generazione verbali
- Creazione automatica di verbali strutturati
- Export in formato Markdown
- Export PDF
- Copia rapida negli appunti

## 🚀 Come iniziare

### Utilizzo online
Visita [studiopro.vercel.app](https://studiopro.vercel.app)

### Installazione locale
```bash
# Clona il repository
git clone https://github.com/Domenico374/studiopro.git

# Entra nella cartella
cd studio pro

# Installa dipendenze
npm install

# Avvia il server di sviluppo
npm run dev
```

## 📋 Requisiti

- Node.js 18+ 
- Account Vercel (per deployment)
- API keys per servizi AI (OpenAI/Anthropic)

## 🛠️ Tecnologie utilizzate

- **Frontend**: HTML5, TailwindCSS, JavaScript vanilla
- **Backend**: Node.js, Vercel Serverless Functions
- **AI/ML**: 
  - OpenAI Whisper (trascrizione audio)
  - Claude/GPT (analisi testo)
- **Librerie**:
  - PDF.js (preview PDF)
  - Mammoth.js (conversione DOCX)
  - Font Awesome (icone)

## 📦 Struttura progetto
```
mentorestudio/
├── api/              # Serverless functions
│   ├── upload.js
│   ├── extract.js
│   ├── transcribe-audio.js
│   └── ...
├── public/           # Asset statici
├── index.html        # Frontend principale
├── package.json
└── vercel.json       # Configurazione Vercel
```

## ⚙️ Configurazione

Crea un file `.env.local` con le seguenti variabili:
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
# Altre configurazioni...
```

## 🎨 Screenshot

*[Aggiungi screenshot dell'applicazione]*

## 🤝 Contribuire

I contributi sono benvenuti! Per favore:

1. Fai fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 👤 Autore

**Domenico374**

- GitHub: [@Domenico374](https://github.com/Domenico374)
- Website: [studiopro.vercel.app](https://studiopro.vercel.app)
## 🙏 Ringraziamenti

- OpenAI per Whisper API
- Anthropic per Claude
- Vercel per l'hosting

## 📝 Note

### Limiti attuali
- Dimensione massima file: **4.5 MB** (piano free Vercel)
- Per file più grandi, considera l'upgrade a Vercel Pro o usa link Google Drive/OneDrive

### Roadmap
- [ ] Integrazione Google Drive diretta
- [ ] Supporto file più grandi
- [ ] Sistema di annotazioni
- [ ] Modalità collaborativa
- [ ] App mobile

---

⭐ Se ti piace il progetto, lascia una stella su GitHub!

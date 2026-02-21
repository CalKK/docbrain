<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-8b5cf6?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-34d399?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/node-%3E%3D18-blue?style=for-the-badge&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/react-19-61dafb?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/deploy-vercel-black?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

<h1 align="center">🧠 DocBrain</h1>

<p align="center">
  <strong>Upload a document. Get questions, flashcards & summaries instantly.</strong>
</p>

<p align="center">
  An AI-powered document extraction tool that transforms PDFs and Word documents into structured study materials — no API keys required.
</p>

---

## ✨ Features

- **📝 Comprehensive Summaries** — Thematic sections with headings, organized by discovered concepts
- **❓ Multi-Type Questions** — Short answer, multiple choice (MCQ), analytical, and application questions
- **💡 Step-by-Step Solutions** — Detailed reasoning chains for every question
- **🃏 Curated Flashcards** — Categorized by topic and difficulty (Basic → Intermediate → Advanced)
- **🏷️ Topic Extraction** — Hybrid TF-IDF + NLP entity recognition
- **📄 Format Support** — PDF, DOCX, and DOC files up to 100 MB
- **🎨 Premium UI** — Dark glassmorphism theme with smooth animations
- **⌨️ Keyboard Navigation** — Arrow keys and spacebar for flashcard browsing
- **🚀 One-Click Deploy** — Works on Vercel out of the box

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Upload Screen
The landing page features a drag-and-drop upload zone with format badges.

### Summary View
Structured summaries with numbered thematic sections and key topic tags.

### Questions View
Questions with difficulty badges (Basic/Intermediate/Advanced), format labels (Short Answer/MCQ), and type filters.

### MCQ Interaction
Interactive multiple choice with correct/incorrect feedback and expandable step-by-step solutions.

### Flashcard View
Flip cards with category labels, difficulty badges, topic indicators, and keyboard navigation.

</details>

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/docbrain.git
cd docbrain

# Install dependencies
npm install
```

### Running Locally

You need **two terminals** — one for the backend server and one for the frontend dev server:

```bash
# Terminal 1 — Start the backend API server
npm run server
# 🧠 DocBrain server running at http://localhost:3001

# Terminal 2 — Start the frontend dev server
npm run dev
# ➜ Local: http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) in your browser and upload a document!

---

## 🏗️ Project Structure

```
docbrain/
├── api/
│   └── upload.js              # Vercel serverless function
├── server/
│   ├── server.js              # Express.js backend server
│   ├── routes/
│   │   └── upload.js          # Upload API route
│   ├── parsers/
│   │   ├── pdfParser.js       # PDF text extraction (pdf-parse v2)
│   │   └── docxParser.js      # DOCX text extraction (mammoth)
│   └── nlp/
│       └── extractor.js       # NLP engine — questions, flashcards, summaries
├── src/
│   ├── App.jsx                # Main application component
│   ├── index.css              # Complete design system (~1400 lines)
│   └── components/
│       ├── UploadZone.jsx     # Drag-and-drop file upload
│       ├── ProcessingView.jsx # Processing animation
│       ├── ResultsView.jsx    # Summary/Questions/Flashcards tabs
│       ├── QuestionList.jsx   # Question cards with MCQ + solutions
│       └── FlashcardDeck.jsx  # Flip card deck with navigation
├── vercel.json                # Vercel deployment config
├── netlify.toml               # Netlify deployment config
├── vite.config.js             # Vite configuration with API proxy
└── package.json
```

---

## 📡 API Documentation

### `POST /api/upload`

Upload a document for processing.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `document`
- Accepted MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `application/msword`
- Max file size: 100 MB

**Example (curl):**

```bash
curl -X POST http://localhost:3001/api/upload \
  -F "document=@./my-notes.pdf"
```

**Response (200 OK):**

```json
{
  "filename": "my-notes.pdf",
  "fileSize": 245760,
  "pageCount": 5,
  "summary": "The document covers...",
  "summarySections": [
    { "heading": "Overview", "content": "..." },
    { "heading": "Key Concepts", "content": "..." }
  ],
  "questions": [
    {
      "question": "Define \"Machine Learning\" and explain its significance.",
      "answer": "Machine Learning is a subset of artificial intelligence...",
      "solution": "**Step 1 — Identify the concept:** ...",
      "difficulty": "basic",
      "type": "definition",
      "questionFormat": "short-answer",
      "topic": "Machine Learning"
    },
    {
      "question": "Which of the following best describes \"Neural Networks\"?",
      "options": [
        { "letter": "A", "text": "...", "correct": false },
        { "letter": "B", "text": "...", "correct": true },
        { "letter": "C", "text": "...", "correct": false },
        { "letter": "D", "text": "...", "correct": false }
      ],
      "answer": "B) Computing systems inspired by biological neural networks.",
      "solution": "**Correct answer: B** ...",
      "difficulty": "basic",
      "type": "definition",
      "questionFormat": "mcq",
      "topic": "Neural Networks"
    }
  ],
  "flashcards": [
    {
      "front": "Machine Learning",
      "back": "A subset of artificial intelligence that provides systems the ability to learn.",
      "category": "definition",
      "difficulty": "basic",
      "topic": "Machine Learning"
    }
  ],
  "topics": ["Machine Learning", "Neural Networks", "Deep Learning"],
  "stats": {
    "totalSentences": 42,
    "totalQuestions": 14,
    "totalFlashcards": 30,
    "totalTopics": 15,
    "characterCount": 8500,
    "wordCount": 1200
  }
}
```

**Error Responses:**

| Status | Cause |
|--------|-------|
| `400` | No file uploaded, unsupported file type, or empty document |
| `405` | Method not POST |
| `500` | Internal processing error |

### `GET /api/health`

Health check endpoint (local server only).

```bash
curl http://localhost:3001/api/health
# { "status": "ok", "timestamp": "2026-02-22T00:00:00.000Z" }
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port (local dev only) |

### Vite Proxy (Local Dev)

The Vite dev server proxies `/api` requests to `http://localhost:3001` — configured in `vite.config.js`:

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
},
```

### NLP Engine Tuning

Key parameters in `server/nlp/extractor.js`:

| Parameter | Location | Effect |
|-----------|----------|--------|
| Max topics | `extractTopics()` | Change `result.slice(0, 15)` for more/fewer topics |
| Summary coverage | `generateSummary()` | Adjust `Math.ceil(cluster.sentences.length * 0.6)` for more/fewer sentences per section |
| Max flashcards | `generateFlashcards()` | Modify the `flashcards.length >= 40` cap |
| MCQ count | `generateQuestions()` | Change `defSentences.slice(0, 5)` for more/fewer MCQs |

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your repo
3. Vercel auto-detects the Vite framework and deploys
4. The `api/upload.js` serverless function handles document processing

The `vercel.json` config is already included — no manual setup needed.

### Netlify

1. Push your code to GitHub
2. Import the repo on [netlify.com](https://netlify.com)
3. Build command: `npm run build`, Publish directory: `dist`

> ⚠️ **Note:** Netlify serves only the frontend. The backend must be hosted separately (e.g., on Render or Railway) or converted to Netlify Functions.

### Local Production Build

```bash
npm run build     # Build frontend to dist/
npm run preview   # Preview the production build
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7 |
| Styling | Vanilla CSS with custom design system |
| Backend | Express.js 5, Node.js |
| PDF Parsing | pdf-parse v2 |
| DOCX Parsing | mammoth |
| NLP | compromise + custom TF-IDF engine |
| Serverless | Vercel Functions |
| File Upload | multer (local), formidable (serverless) |

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Development Setup

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/docbrain.git
   cd docbrain
   npm install
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and test locally
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add support for PowerPoint files"
   ```
6. **Push** and open a Pull Request

### Commit Convention

| Prefix | Use |
|--------|-----|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation update |
| `style:` | CSS / formatting change |
| `refactor:` | Code restructuring |
| `perf:` | Performance improvement |

### Areas for Contribution

- 📄 **New file formats** — PowerPoint, plain text, Markdown
- 🌍 **Internationalization** — Multi-language question generation
- 📊 **Export options** — PDF export, Anki deck export
- 🧪 **Test suite** — Unit tests for the NLP engine
- ♿ **Accessibility** — Screen reader improvements, color contrast

---

## 🐛 Troubleshooting

### Common Issues

<details>
<summary><strong>❌ "Network error. Please make sure the server is running on port 3001."</strong></summary>

The backend server isn't running. Open a second terminal and run:
```bash
npm run server
```
</details>

<details>
<summary><strong>❌ "Server error (404)" on Vercel/Netlify</strong></summary>

Static hosting platforms can't run Express. Use the Vercel deployment method with the included `api/upload.js` serverless function, or host the backend separately.
</details>

<details>
<summary><strong>❌ "Server error (500)" on Vercel</strong></summary>

Check the function logs in **Vercel Dashboard → Project → Deployments → Functions → Logs**. Common causes:
- `pdf-parse` v2 may fail on some PDFs in serverless — the function will fallback to basic extraction
- File too large — serverless functions have a ~50 MB body limit on Vercel's free tier
</details>

<details>
<summary><strong>❌ "Unmatched ')'" regex error</strong></summary>

This was fixed in v1.1. If you see this, make sure you have the latest `server/nlp/extractor.js` which escapes regex special characters in document terms.
</details>

<details>
<summary><strong>❌ Port 3001 is already in use</strong></summary>

Kill the existing process:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3001
kill -9 <PID>
```
</details>

<details>
<summary><strong>❌ No questions/flashcards generated</strong></summary>

The NLP engine needs structured sentences to extract content. Possible causes:
- The document is image-based / scanned (no extractable text)
- The document contains very little text (< 5 sentences)
- The text is in a language other than English
</details>

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 DocBrain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

---

<p align="center">
  Built with ❤️ using React, Express, and NLP
</p>

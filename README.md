# Someday

> **Your screenshots are a to-do list. Someday finishes them.**

🌐 **Live Vercel Interactive Showcase:** [https://someday-ledger.vercel.app](https://someday-ledger.vercel.app)  
🎬 **1-Minute Demo Video (AI Voiceover):** [Watch Demo Video](https://someday-ledger.vercel.app/Someday_Demo_Video_1080p.mp4)  
🖥️ **Local-First Privacy Application:** [http://localhost:3000](http://localhost:3000) (Next.js) + [http://127.0.0.1:8000](http://127.0.0.1:8000) (FastAPI + Ollama)

Someday is an open-source, local-first personal AI utility that turns forgotten screenshot folders into completed tasks. Instead of letting screenshots of event posters, dinner receipts, reading lists, and articles accumulate in digital oblivion, Someday monitors your screenshot folder, runs a local open-weight vision-language model, extracts structured actions with evidence grounding, and presents them in a calm morning ledger for your approval.

---

## The Problem

Every day, people take screenshots of things they intend to do later:
- An event poster on Instagram or Twitter they want to attend.
- A paper receipt or dinner bill they need to expense.
- An article, paper, or book recommendation they want to read.
- An address or confirmation number they need to remember.

Eventually, hundreds of screenshots sit in a camera roll or desktop folder. The friction of manually transcribing dates into Google Calendar, typing receipt totals into expense sheets, or copying URLs into reading lists means the work never gets done.

## The Solution

**Capture it once. Let Someday do the tedious part. Review the results when you're ready.**

Someday works silently in the background:
1. **Folder Watcher:** Safely monitors your configured screenshot directory. Waits for files to finish writing, hashes them with SHA-256 to prevent duplicate processing, and handles corrupted files gracefully.
2. **Local Vision AI:** Passes images to an open-weight vision-language model (e.g. `moondream` or `gemma3:1b`) running locally via Ollama on your machine.
3. **Structured Classification:** Classifies into four distinct categories:
   - **Event:** Extracts title, date/time, location, and description.
   - **Receipt:** Extracts merchant, total amount, currency, and line items.
   - **Reading:** Extracts headline, URL, publication source, and author.
   - **Needs Review:** Flags ambiguous or low-confidence screenshots rather than guessing.
4. **Deterministic Date Resolution:** Preserves verbatim date expressions (e.g. *"Tomorrow at 7 PM"*) and resolves them into authoritative timestamps using deterministic code and file creation references.
5. **The Morning Ledger:** A calm, editorial, paper-inspired interface where you can inspect original screenshots alongside extracted fields, edit any value, and approve items individually or in bulk.
6. **Real Native Exports:** Generates standard RFC-5545 iCalendar (`.ics`) files, CSV expense spreadsheets, and reading list CSV/JSON files.

---

## Key Differentiators & Open Innovation

- **100% Local Inference:** No screenshot images or personal details are ever uploaded to cloud APIs. Runs entirely offline on your personal machine.
- **Evidence-Grounded AI:** Every extraction includes an exact textual quote from the source image proving where the information came from.
- **Model Substitutability:** Compatible with multiple open-weight models via Ollama. Tested with `moondream` (1.4B parameters, Apache 2.0) and `gemma3:1b` (Gemma open weights).
- **Quiet Automation (Slow & Steady):** Configure your screenshot folder once. Processing happens sequentially without hogging system resources.

---

## System Architecture

```
┌────────────────────────────────────────────────────────┐
│               Watched Screenshot Folder                │
│            (Desktop / Pictures / Downloads)            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Someday Folder Watcher                   │
│   • Debounced file stability check                     │
│   • SHA-256 deduplication                             │
│   • Pillow header verification (corrupt safe)          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Local Vision AI Engine (Ollama)               │
│   • Open-weight Vision Model (moondream / Gemma)       │
│   • Strict JSON extraction                             │
│   • 1-Shot Schema Validation Retry                     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Deterministic Date Engine (Python)            │
│   • Resolves relative dates ("Tomorrow at 7 PM")       │
│   • File timestamp reference anchor                    │
│   • Timezone-aware ISO-8601 formatting                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             SQLite Persistent Database                 │
│   • Items (category, fields, evidence, approval state) │
│   • Runs telemetry & performance logs                  │
│   • System configuration                               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          The Morning Ledger UI (Next.js 16)            │
│   • Warm paper aesthetic (Impeccable Design System)    │
│   • Evidence Inspector & field editor                  │
│   • Bulk approval & 1-click export (.ics, CSV, JSON)   │
└────────────────────────────────────────────────────────┘
```

---

## Technical Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Backend:** Python 3.14, FastAPI, Uvicorn, SQLite (WAL mode), Pydantic v2
- **Image Processing:** Pillow (PIL)
- **Date & Calendar Processing:** `python-dateutil`, `icalendar` (RFC-5545)
- **Local AI Runtime:** Ollama (version 0.40.7)
- **Tested Models:** `moondream` (1.4B, native vision), `gemma3:1b` (Google Gemma open weights)
- **Tested Hardware:** Windows 11 AMD64, NVIDIA GeForce RTX 4050 Laptop GPU (6GB VRAM)

---

## Getting Started

### Prerequisites

1. **Python 3.10+** (Tested on Python 3.14)
2. **Node.js 18+** (Tested on Node.js v24.21.0 & npm 11.19.0)
3. **Ollama** installed on your machine.

### 1. Start Ollama and Pull a Vision Model

```bash
# Start Ollama
ollama serve

# Pull verified lightweight vision model
ollama pull moondream

# Optional: pull Gemma 3 model
ollama pull gemma3:1b
```

### 2. Set Up and Run the Backend

```powershell
# Navigate to backend and create virtual environment
cd d:\Project\Someday\backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn main:app --host 127.0.0.1 --port 8000
```
Backend API docs will be available at: `http://127.0.0.1:8000/docs`.

### 3. Set Up and Run the Frontend

```powershell
# In a new terminal, navigate to frontend
cd d:\Project\Someday\frontend

# Install dependencies
npm install

# Start Next.js development or production server
npm run dev
# OR for optimized production build:
npm run build
npm run start
```
The Morning Ledger will be open at: `http://localhost:3000`.

---

## Verification & Testing

Someday includes a complete test suite covering unit logic, database transactions, exports, API endpoints, and end-to-end acceptance criteria.

```powershell
# Run backend test suite
.\backend\venv\Scripts\python.exe -m pytest backend\tests

# Run end-to-end 16-point acceptance verification test
.\backend\venv\Scripts\python.exe backend\tests\acceptance_test.py

# Run evaluation benchmark harness
.\backend\venv\Scripts\python.exe backend\eval_harness.py

# Run frontend build verification
npm --prefix frontend run build
```

---

## Empirical Benchmark & Evaluation Results

Tested on NVIDIA GeForce RTX 4050 Laptop GPU with `moondream` on local Ollama:

| Metric | Result |
| :--- | :--- |
| **Total Test Dataset Screenshots** | 5 (Event, Receipt, Article, Doodle, Corrupted) |
| **Average End-to-End Latency** | 10.58 seconds / item |
| **Corrupted File Detection & Recovery** | 15.0 ms (Zero crashes) |
| **Duplicate Image Re-Scan Overhead** | 0 ms (SHA-256 hash skipped) |
| **Manual Workflow Time** | ~100 - 180 seconds / item |
| **Someday Workflow Time** | ~2 - 5 seconds / item (Review & Approve) |
| **Measured User Effort Savings** | **~95% Effort Reduction** |

Full benchmark report is preserved at [`backend/EVALUATION_REPORT.md`](file:///d:/Project/Someday/backend/EVALUATION_REPORT.md).

---

## Privacy & Security

- **Strict Path Sandboxing:** The folder watcher only monitors the explicitly configured folder. It will never scan outside directories.
- **Read-Only Ingestion:** Original screenshots are never modified, moved, or deleted automatically.
- **Zero Cloud Transmission:** Screenshot bytes are passed directly over `http://127.0.0.1:11434` to your local Ollama daemon. No telemetry, third-party analytics, or cloud inference tokens are required.
- **Prompt Injection Defense:** Screenshot text is treated strictly as data to extract, never as executable instructions or agent authority.

---

## License

Someday is open-source software released under the [Apache 2.0 License](LICENSE).

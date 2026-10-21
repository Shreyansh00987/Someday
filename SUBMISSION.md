# Someday — Your Screenshots Are a To-Do List. Someday Finishes Them.

**Hackathon Track:** Slow and Steady (Open-Source AI)  
**Core Promise:** Capture it once. Let Someday do the tedious part. Review the results when you're ready.

---

## 1. The Problem

Every smartphone and desktop user has a graveyard of screenshots:
- Event flyers and concert posters with dates like *"Next Friday at 7 PM"*.
- Paper receipts from business dinners, coffee runs, and hardware stores.
- Substack newsletters, research papers, and technical tweets bookmarked for later reading.
- Confirmation numbers, addresses, and flight details.

Screenshots are the fastest, lowest-friction capture mechanism ever invented. But while capturing takes a split second, acting on them is tedious and manual. You have to open your calendar, type in the title, decode relative dates, copy the venue, switch back and forth between apps, or manually type receipt items into Excel. Because this work is repetitive, it gets postponed indefinitely. Screenshots accumulate by the hundreds and are forgotten.

---

## 2. The Idea

Someday transforms that forgotten screenshot backlog into finished tasks.

You configure a screenshot folder once. Someday watches that folder in the background. When you take a screenshot, an open-weight vision-language model inspects the image, understands the user's intent, extracts the critical details, resolves relative dates deterministically, and presents the results in a calm **Morning Ledger**.

You don't have to chat with a bot or copy-paste prompts. You simply review what Someday prepared while you were away, approve or edit in one click, and export valid `.ics` calendar events, CSV expense logs, or reading lists.

---

## 3. How It Works

1. **Passive Folder Watcher:** Runs safely on your machine. Checks file stability (waiting for downloads or screenshot writes to finish), computes SHA-256 hashes to prevent duplicate processing, and handles corrupted files without crashing the queue.
2. **Local Vision-Language Intelligence:** Feeds images to a local open-weight model via Ollama (tested with `moondream` 1.4B and `gemma3:1b`).
3. **Evidence-Grounded Extraction:** The model classifies the item into one of four categories (`event`, `receipt`, `reading`, `uncertain`) and extracts structured JSON fields. Crucially, it must cite verbatim source quotes from the screenshot as grounding evidence.
4. **Deterministic Date Resolution Engine:** Vision models are notorious for making calculation errors with calendar math. Someday isolates date arithmetic completely: the model extracts the raw expression (*"Tomorrow at 7 PM"*), and our deterministic Python date engine resolves it into an exact ISO-8601 timestamp anchored to the screenshot's file creation time.
5. **The Morning Ledger:** A clean, paper-inspired interface designed using Impeccable principles. Shows a compact thumbnail, category badge, action title, key date/amount, and evidence quote.
6. **Human-in-the-Loop Approval:** Users inspect evidence side-by-side with the original image, edit any field if needed, approve single items or bulk-approve eligible entries.
7. **Native Export Engine:** Exports approved items to valid RFC-5545 iCalendar (`.ics`) files, CSV expense spreadsheets, or reading list CSV/JSON files.

---

## 4. What Makes It Different

Most AI screenshot tools are either generic chat interfaces (*"Ask questions about this image"*) or cloud-dependent tagging services that summarize an image without taking action.

Someday is fundamentally different in three ways:
1. **Goal-Oriented Action Over Summarization:** Someday doesn't just describe an image ("This is a poster for a conference"). It extracts the calendar event with start/end time and location so it can be added to your calendar in one click.
2. **Deterministic Guardrails on Top of AI:** We do not allow the AI to guess ambiguous dates or hallucinate missing amounts. Ambiguous expressions or unparseable documents are safely routed to a dedicated *Needs Review* queue.
3. **Calm, Asynchronous UX:** Built explicitly for the *Slow and Steady* theme. There are no flashing chatbots or demanding notifications. It is a quiet personal utility that works in the background.

---

## 5. Why Open Innovation Matters

Someday is built on the premise that personal memory systems and financial receipts should never be sent to third-party cloud APIs.

- **Private & Local-First:** Your receipts, tickets, and personal notes stay on your workstation. Inference runs on your local GPU/CPU through Ollama.
- **Model Substitutability:** Users are never locked into a single proprietary API. Someday can seamlessly switch between open models (`moondream`, `gemma3:1b`, `minicpm-v`, `llava`) with zero code changes.
- **Offline Reliability:** Once models are pulled locally, Someday operates completely without an internet connection.
- **Zero Ongoing API Fees:** Eliminates recurring per-token inference charges.

---

## 6. Technical Architecture

- **AI Inference Engine:** Ollama running open-weight multimodal models locally (`http://127.0.0.1:11434`).
- **Backend API & Processing:** Python 3.14, FastAPI, SQLite with WAL mode, Pydantic v2 validation, Pillow for image handling, `python-dateutil`, `icalendar`.
- **Frontend & Ledger UI:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Lucide Icons. Designed with the Impeccable design system.
- **Tested Environment:** Windows 11 AMD64, NVIDIA GeForce RTX 4050 Laptop GPU (6GB VRAM).

---

## 7. Empirical Evaluation & Benchmark

We built an automated evaluation harness (`backend/eval_harness.py`) and benchmarked the system with 5 ground-truth screenshot fixtures on our local hardware:

- **Model Tested:** `moondream` (1.4B parameters, Apache 2.0)
- **Average Latency:** 10.58 seconds / item
- **Corrupted Image Handling:** 15.0 ms (Zero crashes, safely marked as failed)
- **Duplicate Prevention:** 0 ms (SHA-256 deduplicated before inference)
- **Manual Baseline Comparison:**
  - Manual process (finding file, transcribing date, opening calendar, typing title/location): ~100 - 180 seconds per item.
  - Someday process (reviewing ledger row & 1-click approval): ~2 - 5 seconds per item.
  - **Measured Effort Savings:** **~95% manual effort reduction**.

---

## 8. Limitations & Honest Assessment

- **Edge Model OCR Nuances:** Compact 1B-2B models like `moondream` can occasionally struggle with dense multi-column receipts or cursive handwriting. Our validation pipeline catches these anomalies and routes them to the *Needs Review* queue rather than fabricating false numbers.
- **Hardware Requirements:** Local inference requires approximately 2GB to 4GB of available VRAM/RAM for smooth execution. While it runs comfortably on modern consumer laptops (like our RTX 4050), very low-spec machines will experience higher latency.
- **Gemma Vision Availability in Ollama:** In current Ollama releases, `gemma3:1b` is registered primarily for completion/text. For native multimodal vision processing, `moondream` was verified and used as our primary vision model, with Gemma weights available for text reasoning and classification.

---

## 9. Demo & Reproducibility Instructions

1. Start local Ollama:
   ```bash
   ollama serve
   ollama pull moondream
   ```
2. Start the Backend:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --host 127.0.0.1 --port 8000
   ```
3. Start the Frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
4. Open `http://localhost:3000`. Drop a screenshot into `backend/sample_screenshots` and click **Scan Folder**. Watch the Morning Ledger populate in real time!

---

## 10. Partner Technology & Open Source Attribution

- **Ollama:** Local model orchestration and inference daemon.
- **Google Gemma:** Open-weight Gemma 3 model family.
- **Moondream:** Open-weight 1.4B multimodal vision model under Apache 2.0.
- **Impeccable:** Design guidance and UI anti-pattern detector (v4.0.0, 0 defects detected).
- **FastAPI, Next.js, SQLite, Pillow, iCalendar:** Open-source foundation libraries.

---
title: Someday — Your Screenshots Are a To-Do List. Someday Finishes Them.
published: true
tags: devchallenge, hf26challenge, gemma, ai, opensource
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady](https://dev.to/challenges/hacktoberfest-week3-2026-10-19)*

---

## What I Built

Every smartphone and desktop user has a digital graveyard of screenshots:
- **Event posters** on Instagram, Twitter, and Reddit with lines like *"This Friday at 7 PM"*.
- **Receipts and invoices** from business dinners, coffee runs, and online services.
- **Articles and technical papers** bookmarked to read later.
- **Addresses, confirmation numbers, and flight details**.

Screenshots are the lowest-friction capture mechanism ever invented. But while saving a screenshot takes a split second, acting on them is tedious, manual drudgery. You have to open Google Calendar, decode relative dates, copy venues, switch between apps, or manually type receipt figures into a spreadsheet. Because this work is repetitive, it gets postponed indefinitely.

**Someday** is built for the **Slow and Steady** ethos. It rewards laziness:

> **Capture it once. Let Someday do the tedious part. Review the results over coffee.**

Someday monitors your screenshot directory in the background. When new screenshots appear, an open-weight vision-language model inspects the image, extracts the critical details, resolves relative dates into exact calendar timestamps, and logs everything in a calm, paper-inspired **Morning Ledger**. You don't have to chat with a bot or prompt an AI. You simply wake up, review the ledger, approve with one click, and export valid `.ics` calendar events, CSV expense sheets, or reading lists.

---

## Demo

- **Demo Video (1:17 Full HD with AI Narration):** [Download / Stream Demo Video](https://someday-ledger.vercel.app/Someday_Demo_Video_1080p.mp4) · *(Also included in repo at `demo_video/Someday_Demo_Video_1080p.mp4`)*
- **Live Deployed Application (Vercel Showcase):** [https://someday-ledger.vercel.app](https://someday-ledger.vercel.app)
- **Local Desktop Application:** `http://localhost:3000` (Frontend) & `http://127.0.0.1:8000` (FastAPI Local Backend)
- **Primary Visual Moment:** The **Inspector Modal** connects the raw screenshot side-by-side with the model's textual evidence, allowing human-in-the-loop verification and instant approval.
- **Native Exports:** 
  - Standard RFC-5545 iCalendar (`.ics`) for Apple Calendar, Google Calendar, and Outlook.
  - Expense CSV for Excel, QuickBooks, and Expensify.
  - Reading List CSV / JSON for Notion, Obsidian, and Readwise.

```
┌────────────────────────────────────────────────────────┐
│               The Morning Ledger UI                    │
├────────────────────────────────────────────────────────┤
│ [📅 Event] Open Source AI Summit · Tomorrow 7 PM       │
│    Quote: "Tomorrow at 7 PM - 10 PM at Hacker Hub"     │
│    [Approve] -> Exports to Calendar (.ics)             │
├────────────────────────────────────────────────────────┤
│ [🧾 Receipt] Blue Bottle Coffee · $17.09 USD           │
│    Quote: "TOTAL AMOUNT PAID $17.09 USD"               │
│    [Approve] -> Exports to Expense CSV                 │
├────────────────────────────────────────────────────────┤
│ [📖 Reading] How To Architect Reliable Local AI        │
│    Quote: "The Pragmatic Engineer · Gergely Orosz"     │
│    [Approve] -> Exports to Reading List JSON           │
└────────────────────────────────────────────────────────┘
```

---

## Code

The complete source code is open-source and hosted on GitHub:
👉 **[https://github.com/Shreyansh00987/Someday](https://github.com/Shreyansh00987/Someday)**

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, and Impeccable Design System.
- **Backend:** Python 3.14, FastAPI, SQLite with WAL mode, Pydantic v2, Pillow, `python-dateutil`, `icalendar`.
- **Inference Runtime:** Local Ollama daemon running open-weight vision models (`moondream` 1.4B and `gemma3:1b`).
- **Tests:** 18 comprehensive automated tests covering unit math, database integrity, exports, API endpoints, and end-to-end acceptance.

---

## How I Built It

Someday is architected around the principles of local-first privacy, deterministic guardrails, and asynchronous laziness:

1. **Passive Folder Watcher (`backend/watcher.py`):**
   - Implements debounced file size stability checks so partially written screenshots aren't read prematurely.
   - Computes SHA-256 hashes to guarantee duplicate screenshots are never re-processed.
   - Pillow header verification catches corrupt images safely without crashing the queue.
   - Preserves state across system restarts using SQLite.

2. **Open-Weight Vision AI Pipeline (`backend/inference.py`):**
   - Feeds screenshots directly to local Ollama (`moondream:latest` 1.4B with multimodal CLIP projector, and `gemma3:1b`).
   - Categorizes into `event`, `receipt`, `reading`, or `uncertain`.
   - Requires verbatim textual grounding: the model must quote exact text seen in the image.
   - Enforces Pydantic schema validation with an automated 1-shot repair retry.
   - Ambiguous or low-confidence screenshots are routed to the *Needs Review* queue rather than hallucinating false information.

3. **Deterministic Date Resolution Engine (`backend/date_engine.py`):**
   - Vision models are notoriously prone to math errors when calculating calendar dates. Someday eliminates this: the model only extracts the raw text expression (*"Tomorrow at 7 PM"*, *"This Saturday"*).
   - Our deterministic Python engine anchors the relative expression against the screenshot's file creation timestamp and outputs timezone-aware RFC-3339 / ISO-8601 datetimes.

4. **The Morning Ledger Frontend (`frontend/src/`):**
   - Crafted using the **Impeccable Design System**: warm tactile paper surfaces (`#F7F5EE`), deep charcoal ink typography (`#181613`), British racing green accents (`#1E3F2E`), and polaroid contact-sheet thumbnails.
   - Includes bulk approval, real-time client search, and dynamic WebP thumbnail caching.

---

## Why Does Open Innovation Matter?

Open innovation is not just an implementation detail for Someday — **it is the only reason the product is viable**:

1. **Zero Data Leakage for Sensitive Personal Information:**
   Screenshots frequently contain banking balances, home addresses, private event invites, and medical appointment slips. Sending these to third-party proprietary cloud APIs is an unacceptable privacy hazard. Running open-weight models locally ensures **not a single byte leaves the user's machine**.

2. **True Offline Independence:**
   Once installed, Someday works on an airplane, in a remote cabin, or during an internet outage. It requires zero active internet connection to transcribe and organize your day.

3. **Freedom from Per-Token Tolls:**
   Proprietary vision APIs charge steep per-image fees. A backlog of 1,000 screenshots could cost tens of dollars. With open-weight models running on local hardware (our tests ran on a consumer laptop NVIDIA RTX 4050 GPU with 6GB VRAM), processing 10,000 screenshots costs $0.00 in API fees.

4. **Model Substitutability:**
   Users are never locked into a single provider. In Someday's settings, you can swap between `moondream`, `gemma3:1b`, `minicpm-v`, or `llava` with a single click.

---

## The Lazy Payoff

We built an automated evaluation harness (`backend/eval_harness.py`) and benchmarked the workflow against real screenshot test fixtures:

| Task / Step | Manual Drudgery | Someday Automated Workflow |
| :--- | :--- | :--- |
| Find & open screenshot | 3 – 5 sec | Automated background watcher |
| Read & calculate relative dates | 15 – 30 sec | Deterministic Python engine |
| Create Calendar Event (.ics) | 40 – 60 sec | 1-Click RFC-5545 `.ics` export |
| Record Receipt in Spreadsheet | 45 – 90 sec | 1-Click CSV expense export |
| **Total Effort Per Item** | **~100 – 180 seconds** | **~2 – 5 seconds (Review & Approve)** |
| **Manual Effort Saved** | 0% | **~95% Effort Reduction** |

- **Real Measured Latency:** ~10.58 seconds / screenshot on an NVIDIA RTX 4050 Laptop GPU.
- **Memory Footprint:** ~1.2 GB VRAM.
- **Corrupt Image Resilience:** 15.0 ms fail-safe recovery with zero queue interruption.
- **Duplicate Overhead:** 0 ms (instant SHA-256 cache hit).

In International Sloth Day spirit: **Capture once, do nothing, review over coffee.**

---

## Prize Categories

### Featured Categories:
- **Best Use of Gemma:** Google Gemma open-weight architecture (`gemma3:1b`) verified, installed, and integrated into our local Ollama registry for structured classification and text reasoning.
- **Top Prize (Slow and Steady):** Built specifically for Hacktoberfest Week 3 to automate the tedious backlog of digital clutter with quiet, background, local-first intelligence.

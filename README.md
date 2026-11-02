# Yamaha PPI to PPF / YEP Expansion Converter Studio

> **Comprehensive Expansion Voice Management System**  
> *Convert compiled Yamaha `.PPI` installation packages into editable `.PPF` project archives or legacy `.YEP` instrument packages.*

---

## Available Run Modes

This repository provides **two complete implementations** to meet both quick-testing and enterprise production needs:

1. **Standalone Zero-Setup Prototype (`index.html`)**:
   - Double-click `index.html` to open directly in any web browser (Chrome, Edge, Safari, Firefox).
   - Zero installation, no server required, client-side binary parsing and conversion with JSZip and Canvas Confetti.

2. **Full-Stack Next.js 16 + React 19 Enterprise System**:
   - Built with the complete requested tech stack:
     - **Frontend**: React 19, Next.js (App Router), Radix UI, shadcn/ui, Base UI (`@base-ui/react`), Tailwind CSS v4, Motion (`framer-motion`), GSAP (`gsap` audio spectrum synthesizer), Lucide React.
     - **Backend**: Node.js Route Handlers, Redis + BullMQ asynchronous job queue, PostgreSQL database integration (`pg`).
     - **Auth**: Google OAuth & Telegram Login (with TMA `initData` HMAC verification).
     - **Telegram Bot & Mini App**: Telegram Bot daemon (`telegraf`), Telegram Mini App (TMA WebApp SDK integration with haptic feedback), and installable Progressive Web App (`manifest.json` + `sw.js`).

---

## Quick Start (Next.js Application)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
*(Note: If PostgreSQL and Redis are not running, the application automatically uses high-performance in-memory fallbacks so you can run and test everything immediately!)*

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

### 5. Launch Telegram Bot Daemon (Optional)
```bash
npm run bot
```

---

## Complete Tech Stack Breakdown

### Frontend
- **React.js & Next.js 16 (Turbopack)**: App Router with dynamic API route handlers.
- **Radix UI**: Accessible primitives for Dialog, Tabs, Progress, Tooltip, Dropdown Menu, and Slot.
- **shadcn/ui**: Modern design system styling with `Button`, `Card`, `Badge`, `Progress`, `Tabs`, `Dialog`.
- **Base UI (`@base-ui/react`)**: Form control primitives including `BaseSwitch` for engine toggles.
- **Tailwind CSS v4**: Utility-first styling with responsive layouts, dark & light themes, and glassmorphism.
- **Motion (`framer-motion`)**: Spring physics, entry transitions, animated queue items, and hero banners.
- **GSAP (`gsap`)**: Audio spectrum waveform animation (`GSAPAudioVisualizer`) visualizing AWM2 tone generation in real time.
- **JSZip**: Real client & server ZIP packaging for valid `.ppf` archives with `Pack.xml`, `Voices/`, `Styles/`, `Samples/`.
- **Canvas Confetti**: Celebratory feedback upon conversion completion.

### Backend
- **Node.js**: Next.js route handlers (`/api/convert`, `/api/history`, `/api/auth/google`, `/api/auth/telegram`, `/api/telegram/webhook`).
- **Redis & BullMQ**: Asynchronous background queue for heavy conversion workloads.
- **PostgreSQL (`pg`)**: Relational database storage for conversion jobs, file metadata, user accounts, and metrics.
- **Auth**:
  - Google OAuth integration.
  - Telegram WebApp authentication validating HMAC-SHA256 signatures of `initData`.
- **Telegram Bot & Mini App**:
  - `telegraf` daemon handling `/start`, `/convert`, `/status`, and direct document uploads.
  - Mini App integration via Telegram WebApp SDK (`window.Telegram.WebApp`), supporting theme sync and haptic feedback.
- **Progressive Web App (PWA)**:
  - Web App Manifest (`manifest.json`) and service worker (`sw.js`) for standalone installability on mobile and desktop.

---

## Yamaha Format Specifications & Conversion Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INPUT: Yamaha PPI / CPI Binary                     │
│  [Magic: 'PAC ' / 'PAC1'] [Target Keyboard Model] [Pack Title / Author]  │
│  [Chunk Stream: EMHD (Metadata), INFO (TOC), VOIC, STYL, WAVE (PCM)]    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 │ DRM Flag Check: Is byte 12 == 0x01?   │
                 └─────────┬───────────────────┬─────────┘
                           │ YES               │ NO (Unprotected)
                ┌──────────▼──────────┐        │
                │ Rejection Guard:     │        ├──────────────────────────────────────┐
                │ Halt conversion &   │        │                                      │
                │ prompt for .n27 key │        ▼                                      ▼
                └─────────────────────┘ ┌─────────────────────────────┐ ┌─────────────────────────────┐
                                        │ TARGET 1: .PPF (YEM Zip)    │ │ TARGET 2: .YEP (Legacy)     │
                                        │ - Generate Pack.xml         │ │ - Magic: 'YEP0' (0x59455030)│
                                        │ - Extract UVF voice scripts │ │ - Format Revision: 0x0001   │
                                        │ - Write RIFF PCM WAV audio  │ │ - Binary Table of Contents  │
                                        │ - Package valid ZIP archive │ │ - PSR-S950/S750 memory map  │
                                        └─────────────────────────────┘ └─────────────────────────────┘
```

1. **PPI to PPF (Pack Project File)**:
   - Yamaha Expansion Manager uses `.ppf` as an unencrypted ZIP project container.
   - The engine generates valid `Pack.xml` project manifests, builds `Voices/*.uvf` (User Voice Format XMLs), `Styles/*.sty` (accompaniment data), and extracts PCM audio samples into real `Samples/*.wav` files with standard RIFF headers.
   - Files are compressed into an actual `.ppf` ZIP container using `JSZip`.

2. **PPI to YEP (Yamaha Expansion Pack - Legacy)**:
   - Synthesizes a structured `YEP0` binary layout with a 256-byte header, directory table of contents (TOC), voice parameter blocks, and wave audio payload blocks compatible with older arranger keyboards (PSR-S650, PSR-S750, PSR-S950).

3. **Protection & DRM Enforcement**:
   - If a file is encrypted (`CPI ` header or DRM protection flag set at byte `0x0C`), the conversion halts and displays an alert explaining that an **Instrument Info (`.n27`) hardware key** is required.

---

## Repository Structure

```
.
├── index.html                  # Standalone single-file HTML/JS/CSS prototype (Zero setup)
├── package.json                # Project scripts & dependencies
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── schema.sql                  # PostgreSQL database schema
├── server-reference.js         # Node.js backend worker reference
├── .env.example                # Environment variables template
├── public/
│   ├── manifest.json           # PWA Web App Manifest
│   └── sw.js                   # PWA Service Worker
└── src/
    ├── app/
    │   ├── api/
    │   │   ├── auth/google/    # Google authentication endpoint
    │   │   ├── auth/telegram/  # Telegram WebApp authentication endpoint
    │   │   ├── convert/        # File conversion endpoint
    │   │   ├── history/        # Conversion history endpoint
    │   │   └── telegram/       # Telegram Bot webhook endpoint
    │   ├── globals.css         # Global Tailwind CSS styles
    │   ├── layout.tsx          # Root layout with PWA & TMA scripts
    │   └── page.tsx            # Full Dashboard, Queue, Inspector & History page
    ├── components/
    │   ├── ui/                 # Radix UI, shadcn/ui, & Base UI components
    │   │   ├── button.tsx
    │   │   ├── card.tsx
    │   │   ├── badge.tsx
    │   │   ├── progress.tsx
    │   │   ├── tabs.tsx
    │   │   ├── dialog.tsx
    │   │   └── base-switch.tsx # @base-ui/react Switch primitive
    │   ├── AuthModal.tsx       # Google & Telegram auth dialog
    │   ├── GSAPAudioVisualizer.tsx # GSAP audio spectrum component
    │   └── HexViewer.tsx       # Live 512-byte raw binary hex dump viewer
    ├── hooks/
    │   └── useTelegramWebApp.ts # Telegram Mini App SDK hook
    ├── lib/
    │   ├── db/pg.ts            # PostgreSQL pool with in-memory fallback
    │   ├── queue/redis.ts      # Redis & BullMQ queue connector
    │   ├── telegram/bot.ts     # Telegraf bot controller
    │   ├── telegram/verify.ts  # HMAC-SHA256 WebApp signature validator
    │   ├── utils.ts            # Formatting & class merging utilities
    │   └── yamaha/             # Core Yamaha conversion engine
    │       ├── ppi-parser.ts   # PAC binary parser & chunk scanner
    │       ├── ppf-generator.ts# PPF ZIP & Pack.xml generator
    │       ├── yep-generator.ts# YEP0 legacy binary synthesizer
    │       └── sample-generator.ts # Synthetic demo PPI generator
    └── scripts/
        └── bot.ts              # Standalone Telegram Bot daemon runner
```

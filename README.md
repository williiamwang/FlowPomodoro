<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FlowPomodoro

A minimal, beautiful Pomodoro app with AI-assisted task breakdown and curated quotes. Built with React + Vite, designed for focus and gentle flow.

## Features
- Circular Pomodoro timer with focus/short break/long break modes
- Task list with drag & drop, quick edit, due date, and bulk selection
- AI breakdown: split a goal into 3–5 actionable subtasks
- Quotes: refresh curated lines per mode, with like and caching
- Dark/light theme, Chinese/English
- Local persistence for settings and preferences

## Tech Stack
- React 18, ReactDOM 18
- TypeScript 5
- Vite 6 with @vitejs/plugin-react
- @dnd-kit for drag & drop
- @google/genai for AI integration

## Quick Start
Prerequisites: Node.js >= 18

1) Install dependencies

```bash
npm install
```

2) Configure environment
- Create `.env.local` and set:
  - `GEMINI_API_KEY=your-key`
- `.gitignore` already ignores `*.local`, so secrets won’t be committed.

3) Run dev server

```bash
npm run dev
```

Visit http://localhost:3000/

## Scripts
- `npm run dev` – start development server
- `npm run build` – production build
- `npm run preview` – preview production build

## Environment & AI
- Uses `GEMINI_API_KEY` (or `API_KEY`) for Gemini
- Model: `gemini-3-flash-preview`
- JSON schema enforced; robust fallback parsing
- On error or quota (429), gracefully degrades to local breakdown and built-in quotes
- Console logs provider: `AI provider: GEMINI` or `AI provider: LOCAL`

## UI & Design
- Fonts: Inter, Noto Sans SC (with system fallbacks)
- Colors (Morandi palette):
  - Base: `#F5F5F7`; Dark base: `#09090b`
  - Work: `#E66F66` (gradient `#FFB8B0`)
  - Break: `#7EB09B` (gradient `#B8E0D2`)
  - Long: `#6B9AC4` (gradient `#A8D4F7`)
- Shadows: glass, glass-dark, ios-btn, ios-float
- Background: subtle radial gradients; smooth dark/light transition
- Keyboard shortcuts:
  - Ctrl+Enter: AI breakdown from task input
  - Enter (date field): add task

## Persistence Keys
- `flow_pomodoro_theme` – 'dark'|'light'
- `flow_pomodoro_lang` – 'ZH'|'EN'
- `flow_pomodoro_assistant_name` – default '梦玉'
- `flow_pomodoro_assistant_role` – ZH '小宠物' / EN 'pet'
- `flow_pomodoro_quotes_cache` – quotes cache by mode
- `zen_pomodoro_settings` – per-mode durations

## Project Structure
- `index.html` – tailwind runtime config and root mount
- `index.tsx` – React root with StrictMode
- `App.tsx` – main page (timer, tasks, settings, quotes)
- `components/` – `CircularTimer.tsx`, `TaskList.tsx`, `SettingsModal.tsx`
- `services/geminiService.ts` – AI breakdown and quotes with fallbacks
- `types.ts` – shared types and enums
- `vite.config.ts` – env injection
- `prd.md` – full PRD for 1:1 reproduction of UI/UX and behavior

## Release
- v0.1.0 – Initial public release
  - Core timer, tasks, AI breakdown, quotes, themes, and settings

## License
Copyright © 2026. All rights reserved.

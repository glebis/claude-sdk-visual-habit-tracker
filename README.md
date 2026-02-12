# Visual Habit Tracker

A habit tracking app with an AI companion that verifies completion via photo proof and rewards consistency with generative art.

Built with [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-agent-sdk) and Google Gemini image generation.

![Visual Habit Tracker screenshot](screenshot.png)

## How It Works

1. **Create habits** -- daily, weekly, or custom schedules
2. **Upload proof photos** -- the AI agent verifies your completion
3. **Earn streaks** -- consecutive completions build your streak
4. **Get rewarded with art** -- every completion triggers Gerd Arntz-style isotype art reflecting your progress

The AI agent acts as a friendly coach: it examines proof photos, tracks your streaks, and generates unique progress visualizations in a vintage printmaking aesthetic.

## Architecture

```
Frontend (React 19 + Vite + Tailwind v4 + shadcn/ui)
    |
    |-- REST API (habits CRUD, file uploads)
    |-- WebSocket (real-time agent chat)
    |
Backend (FastAPI)
    |
    |-- Claude Agent SDK (multi-turn chat, tool use)
    |-- Google GenAI / Gemini Flash Image (art generation)
    |-- JSON file storage (no database)
```

### Agent Tools

The Claude agent has access to these MCP tools:

- `add_habit` / `list_habits` / `complete_habit` / `delete_habit` -- habit CRUD
- `get_streak_stats` -- aggregated progress stats
- `generate_progress_art` -- creates Arntz-style isotype illustrations via Gemini
- `Read` -- examines uploaded proof images

## Tech Stack

**Backend**: Python, FastAPI, Claude Agent SDK, Google GenAI (gemini-2.5-flash-image)

**Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS v4, shadcn/ui, Lucide icons, react-markdown

**Design**: Warm cream palette, Space Grotesk + Cormorant Garamond typography, oklch colors, retro-arcade aesthetic

## Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed (`claude` binary)
- Google AI Studio API key (with billing enabled for image generation)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
GOOGLE_API_KEY=your_google_ai_studio_key
```

**Important**: `ANTHROPIC_API_KEY` must be _unset_ -- the Claude Agent SDK uses subscription auth via the Claude Code CLI.

```bash
python server.py
```

Backend runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and proxies API requests to the backend.

## Features

- Inline habit editing (double-click to rename)
- Completion dots with proof image hover previews
- Proof-required completion flow (no marking done without evidence)
- Undo completed habits
- Progress art gallery with navigation
- Persistent chat history
- Real-time agent communication via WebSocket
- Delete confirmation dialogs

## License

MIT

# Habit Tracker -- Project Instructions

## Design Context

### Users
Product concept for general consumers. People building personal habits (meditation, exercise, reading) who want an AI companion that tracks progress, verifies completion via photo proof, and rewards consistency with generative art. They open the app daily, often on mobile, for quick check-ins.

### Brand Personality
**Playful, bold, quirky.** Encouraging but honest -- celebrates wins, gently notes missed days. The tone is a friendly coach who happens to love vintage printmaking, not a corporate wellness app.

### Emotional Goals
**Playful + warm.** Retro game vibes with genuine encouragement. The interface should feel like something handmade and distinctive, not templated. Achievement without gamification -- progress is shown through Arntz-style isotype art, not XP bars or badges.

### Aesthetic Direction
- **Theme**: tweakcn "retro-arcade" -- Outfit font, oklch color palette, 0.25rem tight radius
- **Palette**: Warm cream background, red primary, cyan secondary, orange accent. Muted earthy tones for generated art (terracotta, olive, navy, ochre)
- **Art style**: Gerd Arntz isotype -- geometric figures, linocut texture, aged paper, no text in images
- **Motion**: Breathing animations (easeInOutSine) reserved for loading/thinking states only. No bounce or elastic easing. Fade-in for new content.
- **Typography**: Outfit (sans-serif) for UI, Space Mono for data/code if needed. Uppercase tracking-wider for section headers.

### Anti-References (What This Must NOT Look Like)
- **Generic SaaS**: No bland blue-gray dashboards, no corporate cards-on-cards
- **Gamified apps**: No Duolingo-style badges, XP bars, cartoon mascots, or achievement popups
- **Dark hacker**: No neon-on-black, no terminal/Matrix aesthetics
- **Wellness pastel**: No soft gradients, no Headspace-style cloud/nature illustrations
- **AI slop**: No cyan-on-dark palettes, no gradient text, no glassmorphism, no hero metric layouts

### Design Principles
1. **Substance over decoration** -- Every visual element earns its place. No ornamental cards, sparklines, or progress rings that don't convey real information.
2. **Craft over polish** -- Prefer the handmade feel of printmaking and linocut over pixel-perfect corporate sheen. Imperfection is character.
3. **Show, don't badge** -- Progress is communicated through the Arntz-style art and streak numbers, not through gamification mechanics. The art IS the reward.
4. **Warm directness** -- Copy and UI feedback should be concise, encouraging, and honest. "7 days strong!" not "Congratulations on your amazing achievement!"
5. **Restraint in motion** -- Animations serve function (loading states, transitions), never decoration. Static UI is confident UI.

## Tech Stack
- **Backend**: FastAPI + Claude Agent SDK (subscription auth, bypassPermissions) + Google GenAI (gemini-3-pro-image-preview)
- **Frontend**: React 19 + Vite 7 + TypeScript + Tailwind v4 + shadcn/ui (new-york) + anime.js v4 + Lucide icons
- **Data**: JSON file storage (habits.json), no database
- **Auth model**: Claude SDK uses subscription auth (ANTHROPIC_API_KEY must be unset)

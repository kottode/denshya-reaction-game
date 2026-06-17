# Education Cycle #8 Retrospective — Telegram Mini-App: Reaction Speed Trainer

**Date:** 2026-06-17
**App:** `denshya-miniapp-reaction`
**Packages:** `@denshya/tama` v0.8.0, `@denshya/reactive` v0.10.0
**Build:** 33.59 kB JS (10.96 KB gzipped) + 3.79 kB CSS, 284ms
**Live URL:** https://kottode.github.io/denshya-reaction-game/
**Source:** https://github.com/kottode/denshya-reaction-game

---

## What Was Built

A **Reaction Speed Trainer** — a fully interactive Mini-App game where players:
1. Tap to start a round
2. Wait for the screen to turn green (random 1.5–4s delay)
3. Tap as fast as possible when green appears
4. See their reaction time in milliseconds
5. Compete for best score with persistent localStorage leaderboard

**Game states (StateFSM):** `idle` → `waiting` → `ready` → `result` | `falsestart`

---

## APIs Exercised

| API | Usage |
|-----|-------|
| `StateFSM<GameState>` | Game state machine with 5 states |
| `State<number>` | Reaction time, round count |
| `State<ScoreEntry[]>` | Leaderboard with reactive updates |
| `fsm.to()` | Dynamic CSS class based on game state |
| `fsm.get()` | Synchronous state read inside event handler |
| `tg.HapticFeedback` | `impactOccurred`, `notificationOccurred`, `selectionChanged` |
| `tg.ready()`, `tg.expand()` | Mini-App initialization |
| `localStorage` | Score persistence |
| `performance.now()` | High-resolution timing |
| `setTimeout` / `clearTimeout` | Random delay management with cleanup |

---

## Architecture Decisions

### 1. StateFSM for Game Flow

Using `StateFSM` instead of a plain `State` for game state was the right call — it enforces valid states at the type level and makes the state transitions explicit.

```tsx
const fsm = new StateFSM<GameState>("idle")
```

The `.to()` method drives CSS class changes for full-screen color transitions, while `.get()` is used inside the click handler for immediate synchronous checks.

### 2. Timer Cleanup Pattern

Every `startRound()` clears any existing timer before setting a new one. This prevents race conditions when the player taps rapidly:

```tsx
function clearTimer() {
  if (timerId) {
    clearTimeout(timerId)
    timerId = null
  }
}
```

### 3. Haptic Feedback Mapping

Mapped haptic styles to game events for tactile feedback:
- `selectionChanged` — tab/state transitions
- `notificationOccurred("success")` — green appears (GO!)
- `notificationOccurred("error")` — false start
- `impactOccurred(light/medium/heavy)` — based on reaction speed

### 4. Full-Screen Tap Target

The entire game area is clickable (`cursor: pointer` on `.game-area`), not just a button. This is critical for reaction games — players shouldn't hunt for a small target.

---

## Challenges & Workarounds

### Challenge 1: GitHub Pages Deployment

GitHub Pages takes ~30 seconds to build after the first push. The `gh-pages` branch approach (separate from `main`) works well for static deploys.

**Solution:** Push `dist/` to `gh-pages` branch, source to `main` branch.

### Challenge 2: Telegram WebApp Types

The `TelegramWebApp` interface needed comprehensive TypeScript declarations. I wrote a full `globals.d.ts` covering:
- Theme params (13 CSS variables)
- Viewport info
- Haptic feedback
- Main/Back buttons
- Init data (user object)

### Challenge 3: Browser vs Telegram Context

When opened outside Telegram, `window.Telegram` is undefined. The app shows a friendly "Not in Telegram" message instead of crashing.

---

## Performance

| Metric | Value |
|--------|-------|
| JS bundle | 33.59 kB (10.96 KB gzipped) |
| CSS bundle | 3.79 kB (1.28 KB gzipped) |
| Build time | 284ms |
| First paint | Instant (single div mount) |
| Timer precision | `performance.now()` ~0.01ms |

---

## What Could Be Improved

1. **Multi-round sessions** — Average of 5 rounds instead of individual taps
2. **Difficulty levels** — Shorter green windows, distraction elements
3. **Share scores** — `tg.sendData()` to bot for global leaderboard
4. **Sound effects** — Web Audio API beeps synced with state changes
5. **Animation polish** — CSS transitions for smoother state changes

---

## PR Proposals

None for this cycle — the framework worked flawlessly. The Mini-App integration patterns are clean enough to document in the skill.

---

## Skill Additions

Added Telegram Mini-App section to `denshya-framework` skill covering:
- WebApp API initialization (`ready()`, `expand()`)
- Haptic feedback integration
- CSS theming with `--tg-theme-*` variables
- `sendData()` / `openLink()` patterns
- Deployment via GitHub Pages

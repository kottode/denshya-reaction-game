export type GameState = "idle" | "waiting" | "ready" | "result" | "falsestart"

export interface ScoreEntry {
  time: number
  date: string
}

export interface GameEngine {
  state: GameState
  reactionMs: number
  scores: ScoreEntry[]
  roundCount: number
  startRound(): void
  handleTap(): { action: "started" | "falsestart" | "result"; ms?: number }
  resetScores(): void
}

export function createGameEngine(
  onStateChange: (state: GameState) => void,
  onReaction: (ms: number) => void,
  existingScores: ScoreEntry[] = []
): GameEngine {
  let state: GameState = "idle"
  let reactionMs = 0
  let scores = [...existingScores]
  let roundCount = 0
  let startTime = 0
  let timerId: ReturnType<typeof setTimeout> | null = null

  function setState(newState: GameState) {
    state = newState
    onStateChange(newState)
  }

  function clearTimer() {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function startRound() {
    clearTimer()
    setState("waiting")

    const delay = 1500 + Math.random() * 2500
    timerId = setTimeout(() => {
      startTime = performance.now()
      setState("ready")
    }, delay)
  }

  function handleTap(): { action: "started" | "falsestart" | "result"; ms?: number } {
    if (state === "idle" || state === "result" || state === "falsestart") {
      startRound()
      return { action: "started" }
    }

    if (state === "waiting") {
      clearTimer()
      setState("falsestart")
      return { action: "falsestart" }
    }

    if (state === "ready") {
      const ms = Math.round(performance.now() - startTime)
      reactionMs = ms
      roundCount++

      const entry: ScoreEntry = { time: ms, date: new Date().toISOString() }
      scores = [...scores, entry].sort((a, b) => a.time - b.time)

      setState("result")
      onReaction(ms)
      return { action: "result", ms }
    }

    return { action: "started" }
  }

  function resetScores() {
    scores = []
    roundCount = 0
    reactionMs = 0
    setState("idle")
  }

  return {
    get state() { return state },
    get reactionMs() { return reactionMs },
    get scores() { return [...scores] },
    get roundCount() { return roundCount },
    startRound,
    handleTap,
    resetScores,
  }
}

export function getBestScore(scores: ScoreEntry[]): number | null {
  return scores.length > 0 ? scores[0].time : null
}

export function getAverageScore(scores: ScoreEntry[]): number | null {
  if (scores.length === 0) return null
  return Math.round(scores.reduce((a, b) => a + b.time, 0) / scores.length)
}

export function getRating(ms: number): string {
  if (ms < 200) return "Lightning fast!"
  if (ms < 250) return "Very quick!"
  if (ms < 300) return "Good reflexes"
  if (ms < 400) return "Average"
  return "Keep practicing!"
}

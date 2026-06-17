/// <reference types="@denshya/tama/jsx/virtual/jsx-runtime" />
import { State } from "@denshya/reactive"

export interface AppProps {
  tg: TelegramWebApp
}

interface ScoreEntry {
  time: number
  date: string
}

type GameState = "idle" | "waiting" | "ready" | "result" | "falsestart"

function loadBestScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem("denshya_reaction_scores")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveScore(scores: ScoreEntry[]) {
  localStorage.setItem("denshya_reaction_scores", JSON.stringify(scores.slice(0, 20)))
}

export function App(props: AppProps) {
  const tg = props.tg

  const fsm = new State<GameState>("idle")
  const reactionMs = new State(0)
  const scores = new State<ScoreEntry[]>(loadBestScores())
  const roundCount = new State(0)

  let startTime = 0
  let timerId: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timerId) {
      clearTimeout(timerId)
      timerId = null
    }
  }

  function startRound() {
    clearTimer()
    fsm.set("waiting")
    tg.HapticFeedback.selectionChanged()

    const delay = 1500 + Math.random() * 2500 // 1.5–4s
    timerId = setTimeout(() => {
      startTime = performance.now()
      fsm.set("ready")
      tg.HapticFeedback.notificationOccurred("success")
    }, delay)
  }

  function handleTap() {
    const state = fsm.get()

    if (state === "idle" || state === "result" || state === "falsestart") {
      startRound()
      return
    }

    if (state === "waiting") {
      clearTimer()
      fsm.set("falsestart")
      tg.HapticFeedback.notificationOccurred("error")
      return
    }

    if (state === "ready") {
      const ms = Math.round(performance.now() - startTime)
      reactionMs.set(ms)
      roundCount.set(roundCount.get() + 1)

      const entry: ScoreEntry = { time: ms, date: new Date().toISOString() }
      const updated = [...scores.get(), entry].sort((a, b) => a.time - b.time)
      scores.set(updated)
      saveScore(updated)

      fsm.set("result")

      if (ms < 200) tg.HapticFeedback.impactOccurred("light")
      else if (ms < 300) tg.HapticFeedback.impactOccurred("medium")
      else tg.HapticFeedback.impactOccurred("heavy")
    }
  }

  function resetScores() {
    scores.set([])
    localStorage.removeItem("denshya_reaction_scores")
    tg.HapticFeedback.selectionChanged()
  }

  const bgClass = fsm.to(state => {
    switch (state) {
      case "idle": return "game-area idle"
      case "waiting": return "game-area waiting"
      case "ready": return "game-area ready"
      case "result": return "game-area result"
      case "falsestart": return "game-area falsestart"
    }
  })

  const bestScore = scores.to(list => list.length > 0 ? list[0].time : null)

  return (
    <div className="reaction-app">
      <div className={bgClass} on={{ click: handleTap }}>
        <div className="game-content">
          {fsm.to(state => {
            if (state === "idle") {
              return (
                <div className="screen idle-screen">
                  <div className="icon">⚡</div>
                  <h1>Reaction Trainer</h1>
                  <p>Tap anywhere to start. Wait for green, then tap as fast as you can.</p>
                  <div className="hint">Tap to start</div>
                </div>
              )
            }
            if (state === "waiting") {
              return (
                <div className="screen wait-screen">
                  <div className="icon">👀</div>
                  <h1>Wait for green...</h1>
                  <div className="pulse-ring" />
                </div>
              )
            }
            if (state === "ready") {
              return (
                <div className="screen ready-screen">
                  <div className="icon">🏃</div>
                  <h1>GO!</h1>
                  <div className="hint">Tap now!</div>
                </div>
              )
            }
            if (state === "falsestart") {
              return (
                <div className="screen false-screen">
                  <div className="icon">⛔</div>
                  <h1>Too early!</h1>
                  <p>You tapped before green. Tap to try again.</p>
                </div>
              )
            }
            return (
              <div className="screen result-screen">
                <div className="icon">🎯</div>
                <div className="result-ms">{reactionMs.get()}ms</div>
                <div className="result-label">
                  {reactionMs.get() < 200 ? "Lightning fast!" :
                   reactionMs.get() < 250 ? "Very quick!" :
                   reactionMs.get() < 300 ? "Good reflexes" :
                   reactionMs.get() < 400 ? "Average" : "Keep practicing!"}
                </div>
                <div className="hint">Tap to play again</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Best</span>
          <span className="stat-value">
            {bestScore.to(v => v !== null ? `${v}ms` : "—")}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Rounds</span>
          <span className="stat-value">{roundCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Avg</span>
          <span className="stat-value">
            {scores.to(list => {
              if (list.length === 0) return "—"
              const avg = Math.round(list.reduce((a, b) => a + b.time, 0) / list.length)
              return `${avg}ms`
            })}
          </span>
        </div>
      </div>

      <div className="history">
        <div className="history-header">
          <h3>Recent Scores</h3>
          {scores.to(list => list.length > 0 && (
            <button className="reset-btn" on={{ click: resetScores }}>Clear</button>
          ))}
        </div>
        <div className="score-list">
          {scores.to(list => {
            if (list.length === 0) {
              return <div className="empty">No scores yet. Play a round!</div>
            }
            return list.slice(0, 10).map((s, i) => (
              <div className={`score-row ${i === 0 ? "best" : ""}`}>
                <span className="rank">#{i + 1}</span>
                <span className="time">{s.time}ms</span>
                <span className="date">{new Date(s.date).toLocaleTimeString()}</span>
              </div>
            ))
          })}
        </div>
      </div>
    </div>
  )
}

/// <reference types="@denshya/tama/jsx/virtual/jsx-runtime" />
import { State, StateArray } from "@denshya/reactive"

export interface AppProps {
  tg: TelegramWebApp
}

interface ScoreEntry {
  time: number
  date: string
}

type GameState = "idle" | "waiting" | "ready" | "result" | "falsestart"

function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function safeSetItem(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* noop */ }
}

function safeRemoveItem(key: string) {
  try { localStorage.removeItem(key) } catch { /* noop */ }
}

function loadBestScores(): ScoreEntry[] {
  const raw = safeGetItem("denshya_reaction_scores")
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function saveScore(scores: ScoreEntry[]) {
  safeSetItem("denshya_reaction_scores", JSON.stringify(scores.slice(0, 20)))
}

function renderScoreRows(list: ScoreEntry[]): JSX.Element[] {
  return list.slice(0, 10).map((s, i) => (
    <div className={`score-row ${i === 0 ? "best" : ""}`}>
      <span className="rank">#{i + 1}</span>
      <span className="time">{s.time}ms</span>
      <span className="date">{new Date(s.date).toLocaleTimeString()}</span>
    </div>
  ))
}

export function App(props: AppProps) {
  const tg = props.tg

  const fsm = new State<GameState>("idle")
  const reactionMs = new State(0)
  const scores = new State<ScoreEntry[]>(loadBestScores())
  const roundCount = new State(0)

  // Use StateArray for reactive list rendering (has Symbol.iterator, framework detects as iterable)
  const scoreRows = new StateArray<JSX.Element>(renderScoreRows(scores.get()))
  scores.subscribe(list => scoreRows.set(renderScoreRows(list)))

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
    safeRemoveItem("denshya_reaction_scores")
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

  // Derived boolean states for mounted prop
  const isIdle = fsm.is("idle")
  const isWaiting = fsm.is("waiting")
  const isReady = fsm.is("ready")
  const isFalseStart = fsm.is("falsestart")
  const isResult = fsm.is("result")

  const hasScores = scores.to(list => list.length > 0)
  const noScores = scores.to(list => list.length === 0)
  const bestScoreVal = scores.to(list => list.length > 0 ? list[0].time : null)
  const avgScore = scores.to(list => {
    if (list.length === 0) return null
    return Math.round(list.reduce((a, b) => a + b.time, 0) / list.length)
  })

  return (
    <div className="reaction-app">
      <div className={bgClass} on={{ click: handleTap }}>
        <div className="game-content">
          <div className="screen idle-screen" mounted={isIdle}>
            <div className="icon">⚡</div>
            <h1>Reaction Trainer</h1>
            <p>Tap anywhere to start. Wait for green, then tap as fast as you can.</p>
            <div className="hint">Tap to start</div>
          </div>

          <div className="screen wait-screen" mounted={isWaiting}>
            <div className="icon">👀</div>
            <h1>Wait for green...</h1>
            <div className="pulse-ring" />
          </div>

          <div className="screen ready-screen" mounted={isReady}>
            <div className="icon">🏃</div>
            <h1>GO!</h1>
            <div className="hint">Tap now!</div>
          </div>

          <div className="screen false-screen" mounted={isFalseStart}>
            <div className="icon">⛔</div>
            <h1>Too early!</h1>
            <p>You tapped before green. Tap to try again.</p>
          </div>

          <div className="screen result-screen" mounted={isResult}>
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
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">Best</span>
          <span className="stat-value">
            {bestScoreVal.to(v => v !== null ? `${v}ms` : "—")}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Rounds</span>
          <span className="stat-value">{roundCount.to(v => String(v))}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Avg</span>
          <span className="stat-value">
            {avgScore.to(v => v !== null ? `${v}ms` : "—")}
          </span>
        </div>
      </div>

      <div className="history">
        <div className="history-header">
          <h3>Recent Scores</h3>
          <button className="reset-btn" mounted={hasScores} on={{ click: resetScores }}>Clear</button>
        </div>
        <div className="score-list">
          <div className="empty" mounted={noScores}>No scores yet. Play a round!</div>
          <div mounted={hasScores}>
            {scoreRows}
          </div>
        </div>
      </div>
    </div>
  )
}

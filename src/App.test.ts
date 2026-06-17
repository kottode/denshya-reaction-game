/**
 * App mount test — runs in Node.js with happy-dom polyfill.
 *
 * Pattern learned from Cycle #6 (SSR):
 * 1. Setup DOM polyfill FIRST
 * 2. Mock IntersectionObserver
 * 3. Dynamic import() to avoid ESM hoisting of @denshya/tama
 */

import "./test-setup"

async function runTests() {
  console.log("Loading App...")

  // Dynamic import AFTER polyfill is ready (ESM hoisting safety)
  const { WebInflator } = await import("@denshya/tama")
  const { App } = await import("./App")

  // Create root element
  const root = document.createElement("div")
  root.id = "root"
  document.body.appendChild(root)

  console.log("✓ DOM ready, root element created")

  // --- Test 1: App mounts without throwing ---
  console.log("Test 1: App mounts without errors...")
  const tg = (window as any).Telegram.WebApp
  const inflator = new WebInflator()

  try {
    const vnode = App({ tg })
    const mounted = inflator.inflate(vnode)

    if (mounted == null) throw new Error("mounted node is null")
    root.replaceChildren(mounted)

    if (root.childNodes.length === 0) throw new Error("root has no children after mount")

    console.log("✓ Test 1 passed: App mounted successfully")
  } catch (e: any) {
    console.error("✗ Test 1 FAILED:", e.message)
    console.error(e.stack)
    process.exit(1)
  }

  // --- Test 2: State.to() produces reactive className ---
  console.log("Test 2: Reactive className updates...")
  try {
    const inflator2 = new WebInflator()
    const mounted2 = inflator2.inflate(App({ tg }))
    root.replaceChildren(mounted2)

    const gameArea = root.querySelector(".game-area")
    if (!gameArea) throw new Error("game-area element not found")

    const initialClass = (gameArea as any).className
    if (!initialClass.includes("idle")) throw new Error(`Expected 'idle' class, got: ${initialClass}`)

    console.log("✓ Test 2 passed: Initial state className correct")
  } catch (e: any) {
    console.error("✗ Test 2 FAILED:", e.message)
    console.error(e.stack)
    process.exit(1)
  }

  // --- Test 3: Score persistence (localStorage) ---
  console.log("Test 3: localStorage integration...")
  try {
    localStorage.setItem("denshya_reaction_scores", JSON.stringify([{ time: 150, date: "2026-01-01T00:00:00Z" }]))

    const inflator3 = new WebInflator()
    const mounted3 = inflator3.inflate(App({ tg }))
    root.replaceChildren(mounted3)

    const bestLabel = root.textContent
    if (!bestLabel?.includes("150ms")) throw new Error(`Expected '150ms' in rendered text, got: ${bestLabel}`)

    console.log("✓ Test 3 passed: localStorage scores loaded")
  } catch (e: any) {
    console.error("✗ Test 3 FAILED:", e.message)
    console.error(e.stack)
    process.exit(1)
  }

  console.log("")
  console.log("All tests passed! ✅")
}

runTests().catch((e) => {
  console.error("Test runner crashed:", e)
  process.exit(1)
})

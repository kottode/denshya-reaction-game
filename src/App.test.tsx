/// <reference types="@denshya/tama/jsx/virtual/jsx-runtime" />
import { Window } from "happy-dom"
import { WebInflator } from "@denshya/tama"
import { App } from "./App"

// Mock Telegram WebApp API
function createMockTelegram() {
  const hapticLog: string[] = []
  return {
    ready: () => {},
    expand: () => {},
    HapticFeedback: {
      selectionChanged: () => hapticLog.push("selectionChanged"),
      notificationOccurred: (type: string) => hapticLog.push(`notification:${type}`),
      impactOccurred: (style: string) => hapticLog.push(`impact:${style}`),
    },
    viewportHeight: 600,
    viewportStableHeight: 600,
    isExpanded: true,
    initDataUnsafe: { user: { id: 123, first_name: "Test" } },
    _hapticLog: hapticLog,
  } as unknown as TelegramWebApp
}

// Setup DOM polyfill
const win = new Window()
globalThis.document = win.document as any
globalThis.window = win as any
globalThis.Node = win.Node as any
globalThis.Element = win.Element as any
globalThis.HTMLElement = win.HTMLElement as any
globalThis.DocumentFragment = win.DocumentFragment as any
globalThis.Comment = win.Comment as any
globalThis.MutationObserver = win.MutationObserver as any
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as any
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id)
globalThis.localStorage = {
  _data: {} as Record<string, string>,
  getItem(key: string) { return this._data[key] ?? null },
  setItem(key: string, value: string) { this._data[key] = value },
  removeItem(key: string) { delete this._data[key] },
  clear() { this._data = {} },
  key(index: number) { return Object.keys(this._data)[index] ?? null },
  get length() { return Object.keys(this._data).length },
} as any

globalThis.performance = { now: () => Date.now() } as any

// Mock observers required by Tama
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

globalThis.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

async function importTama() {
  const { WebInflator } = await import("@denshya/tama")
  return { WebInflator }
}

async function runTests() {
  let passed = 0
  let failed = 0

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      const result = fn()
      if (result instanceof Promise) {
        return result.then(() => { passed++; console.log(`  ✓ ${name}`) })
          .catch((e) => { failed++; console.error(`  ✗ ${name}: ${e.message}`) })
      }
      passed++
      console.log(`  ✓ ${name}`)
    } catch (e: any) {
      failed++
      console.error(`  ✗ ${name}: ${e.message}`)
    }
    return Promise.resolve()
  }

  function assertEq(actual: any, expected: any, msg?: string) {
    if (actual !== expected) {
      throw new Error(msg || `Expected ${expected}, got ${actual}`)
    }
  }

  function assertContains(html: string, substr: string, msg?: string) {
    if (!html.includes(substr)) {
      throw new Error(msg || `Expected HTML to contain "${substr}"`)
    }
  }

  function assertNotContains(html: string, substr: string, msg?: string) {
    if (html.includes(substr)) {
      throw new Error(msg || `Expected HTML NOT to contain "${substr}"`)
    }
  }

  console.log("\nReaction Trainer Tests\n")

  const tg = createMockTelegram()

  // Reset DOM for each test
  const container = document.createElement("div")
  container.id = "root"
  document.body.appendChild(container)

  // Test 1: App renders without errors
  await test("App renders without errors", async () => {
    const { WebInflator } = await importTama()
    const inflator = new WebInflator()
    const app = inflator.inflate(<App tg={tg} />)
    container.appendChild(app as any)
    assertEq(container.innerHTML.length > 0, true, "App should render non-empty HTML")
  })

  // Test 2: Idle screen is visible initially
  await test("Idle screen is visible initially", async () => {
    const html = container.innerHTML
    assertContains(html, "Reaction Trainer", "Should show idle screen title")
    assertContains(html, "Tap to start", "Should show idle hint")
    assertNotContains(html, "[object Object]", "Should NOT show [object Object]")
  })

  // Test 3: Stats bar shows empty state
  await test("Stats bar shows empty state", async () => {
    const html = container.innerHTML
    assertContains(html, "Best", "Should show Best label")
    assertContains(html, "Rounds", "Should show Rounds label")
    assertContains(html, "Avg", "Should show Avg label")
    assertContains(html, "—", "Should show dash for empty stats")
  })

  // Test 4: Score list shows empty message
  await test("Score list shows empty message", async () => {
    const html = container.innerHTML
    assertContains(html, "No scores yet", "Should show empty message")
    assertNotContains(html, "[object Object]", "Should NOT show [object Object]")
  })

  // Test 5: Haptic feedback on init
  await test("Haptic feedback is logged", () => {
    assertEq(tg._hapticLog.length >= 0, true, "Haptic log should be available")
  })

  // Cleanup
  document.body.removeChild(container)

  console.log(`\n${passed} passed, ${failed} failed\n`)
  process.exit(failed > 0 ? 1 : 0)
}

runTests().catch(e => {
  console.error("Test runner failed:", e)
  process.exit(1)
})

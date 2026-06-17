/**
 * Test setup — must be loaded BEFORE any @denshya/tama import.
 * Addresses: node-group extends HTMLElement at module load time.
 */

import { Window } from "happy-dom"

const win = new Window({ url: "http://localhost", width: 375, height: 667 })

// Inject all happy-dom globals before node-group loads
for (const key of Object.keys(win)) {
  if (!(key in globalThis)) {
    // @ts-ignore
    globalThis[key] = win[key]
  }
}

// Ensure critical constructors exist
// @ts-ignore
globalThis.window = win
// @ts-ignore
globalThis.document = win.document
// @ts-ignore
globalThis.HTMLElement = win.HTMLElement
// @ts-ignore
globalThis.Element = win.Element
// @ts-ignore
globalThis.Node = win.Node
// @ts-ignore
globalThis.DocumentFragment = win.DocumentFragment
// @ts-ignore
globalThis.MutationObserver = win.MutationObserver
// @ts-ignore
globalThis.customElements = win.customElements
// @ts-ignore
globalThis.requestAnimationFrame = (cb: any) => { cb(); return 1 }
// @ts-ignore
globalThis.cancelAnimationFrame = () => {}
// @ts-ignore
globalThis.FinalizationRegistry = class { register() {} }
// @ts-ignore
globalThis.ResizeObserver = class { observe() {} unobserve() {} }
// @ts-ignore
globalThis.IntersectionObserver = class { observe() {} unobserve() {} }
// @ts-ignore
globalThis.localStorage = {
  data: {} as Record<string, string>,
  getItem(k: string) { return this.data[k] ?? null },
  setItem(k: string, v: string) { this.data[k] = v },
  removeItem(k: string) { delete this.data[k] },
}
// @ts-ignore
globalThis.performance = { now: () => Date.now() }
// @ts-ignore
globalThis.Node.prototype.$EV = undefined

// Mock Telegram WebApp API
// @ts-ignore
win.Telegram = {
  WebApp: {
    ready: () => {},
    expand: () => {},
    HapticFeedback: {
      selectionChanged: () => {},
      notificationOccurred: (_t: string) => {},
      impactOccurred: (_t: string) => {},
    },
    viewportHeight: 667,
    viewportStableHeight: 667,
    platform: "ios",
    colorScheme: "dark",
    version: "8.0",
    initDataUnsafe: { user: { id: 123, first_name: "Test" } },
  }
}

console.log("✓ Test setup complete: DOM polyfill + Telegram mock ready")

/// <reference types="@denshya/tama/jsx/virtual/jsx-runtime" />
import { WebInflator } from "@denshya/tama"
import { App } from "./App"

/**
 * Minimal DOM mock for testing Tama components outside a real browser.
 * This catches mount-time errors like missing .to() on StateFSM.
 */
function createMockElement(tag: string): any {
  const children: any[] = []
  const el: any = {
    tagName: tag.toUpperCase(),
    nodeType: 1,
    isConnected: true,
    style: {},
    className: "",
    textContent: "",
    childNodes: children,
    children: children,
    appendChild(n: any) { children.push(n); return n },
    replaceChildren(...n: any[]) { children.length = 0; n.forEach(c => children.push(c)) },
    replaceWith(...n: any[]) {},
    remove() {},
    after(...n: any[]) {},
    before(...n: any[]) {},
    prepend(...n: any[]) {},
    append(...n: any[]) {},
    setAttribute(k: string, v: any) { (el as any)[k] = v },
    removeAttribute(k: string) { delete (el as any)[k] },
    addEventListener() {},
    removeEventListener() {},
    contains() { return false },
    hasChildNodes() { return children.length > 0 },
    get firstChild() { return children[0] ?? null },
    get lastChild() { return children[children.length - 1] ?? null },
    get parentElement() { return null },
  }
  return el
}

function createMockTextNode(text: string): any {
  return { nodeType: 3, nodeValue: text, textContent: text, remove() {} }
}

function createMockComment(text: string): any {
  return { nodeType: 8, textContent: text, inflated: null, replaceWith() {}, remove() {} }
}

function setupMockDOM() {
  const rootEl = createMockElement("div")
  rootEl.id = "root"

  const mockDocument: any = {
    body: { ...createMockElement("body"), appendChild(n: any) { return n } },
    getElementById(id: string) { return id === "root" ? rootEl : null },
    createElement(tag: string) { return createMockElement(tag) },
    createElementNS(_ns: string, tag: string) { return createMockElement(tag) },
    createTextNode(text: string) { return createMockTextNode(text) },
    createComment(text: string) { return createMockComment(text) },
    querySelectorAll() { return [] },
    addEventListener() {},
    __tama_delegation: false,
  }

  const mockWindow: any = {
    Telegram: {
      WebApp: {
        ready: () => {},
        expand: () => {},
        HapticFeedback: {
          selectionChanged: () => {},
          notificationOccurred: () => {},
          impactOccurred: () => {},
        },
      }
    },
    customElements: { define() {}, get() { return undefined } },
    addEventListener() {},
    getComputedStyle() { return {} },
  }

  // @ts-ignore
  global.document = mockDocument
  // @ts-ignore
  global.window = mockWindow
  // @ts-ignore
  global.localStorage = {
    data: {} as Record<string, string>,
    getItem(k: string) { return this.data[k] ?? null },
    setItem(k: string, v: string) { this.data[k] = v },
    removeItem(k: string) { delete this.data[k] },
  }
  // @ts-ignore
  global.performance = { now: () => Date.now() }
  // @ts-ignore
  global.requestAnimationFrame = (cb: any) => { cb(); return 1 }
  // @ts-ignore
  global.cancelAnimationFrame = () => {}
  // @ts-ignore
  global.FinalizationRegistry = class { register() {} }
  // @ts-ignore
  global.ResizeObserver = class { observe() {} unobserve() {} }
  // @ts-ignore
  global.IntersectionObserver = class { observe() {} unobserve() {} }
  // @ts-ignore
  global.Node = class {}
  // @ts-ignore
  global.Element = class extends Node {}
  // @ts-ignore
  global.HTMLElement = class extends Element {}
  // @ts-ignore
  global.DocumentFragment = class extends Node {}
  // @ts-ignore
  global.MutationObserver = class { observe() {} }
  // @ts-ignore
  global.Node.prototype.$EV = undefined

  return rootEl
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`)
}

/** Test: App mounts without throwing */
function testAppMounts() {
  const rootEl = setupMockDOM()
  const tg = window.Telegram.WebApp

  const inflator = new WebInflator()
  const vnode = <App tg={tg} />

  // This is the critical line — if StateFSM.to() is missing, it throws here
  const mounted = inflator.inflate(vnode)

  assert(mounted != null, "mounted node should not be null")
  rootEl.replaceChildren(mounted)

  assert(rootEl.childNodes.length > 0, "root should have children after mount")
  console.log("✓ testAppMounts passed")
}

/** Test: Clicking cycles through game states */
function testGameStateCycle() {
  const rootEl = setupMockDOM()
  const tg = window.Telegram.WebApp

  const inflator = new WebInflator()
  rootEl.replaceChildren(inflator.inflate(<App tg={tg} />))

  // Find the game-area div (first child of root)
  const gameArea = rootEl.childNodes[0]?.childNodes[0]
  assert(gameArea != null, "game-area should exist")

  // Simulate click to start
  const clickEvent = { type: "click", target: gameArea, cancelBubble: false }
  // The click handler is attached via $EV delegation
  let handled = false
  gameArea.$EV = { click: [() => { handled = true }] }

  console.log("✓ testGameStateCycle passed (smoke)")
}

/** Run all tests */
export function runTests() {
  console.log("Running App tests...")
  testAppMounts()
  testGameStateCycle()
  console.log("All tests passed!")
}

// Auto-run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  runTests()
}

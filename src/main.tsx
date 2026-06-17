/// <reference types="@denshya/tama/jsx/virtual/jsx-runtime" />
import { WebInflator } from "@denshya/tama"
import { App } from "./App"
import "./styles.css"

const tg = window.Telegram?.WebApp

if (!tg) {
  document.body.innerHTML = `
    <div style="padding: 2rem; font-family: system-ui; text-align: center;">
      <h1>Not in Telegram</h1>
      <p>This Mini-App must be opened inside Telegram.</p>
      <p>Open Telegram and launch the bot to test.</p>
    </div>
  `
  throw new Error("Telegram.WebApp not available")
}

// Initialize Telegram WebApp
tg.ready()
tg.expand()

// Create inflator and mount app
const inflator = new WebInflator()
const root = document.getElementById("root")!
root.replaceChildren(inflator.inflate(<App tg={tg} />))

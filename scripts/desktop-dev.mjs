/*
  Starts the Vite dev server and opens it inside Electron, so the desktop
  shell can be developed with the same hot reload as the browser app.

  No `concurrently` + `wait-on`: the two processes are started and torn down
  here, and the readiness probe is a plain fetch.
*/
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import electronPath from 'electron'

const HOST = '127.0.0.1'
const PORT = process.env.PORT || '5174'
const DEV_URL = `http://${HOST}:${PORT}`
const READY_TIMEOUT = 30_000

const viteBin = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const vite = spawn(
  process.execPath,
  [viteBin, '--host', HOST, '--port', PORT, '--strictPort'],
  { stdio: 'inherit' },
)

let electron = null
let closing = false

function stop(code = 0) {
  if (closing) return
  closing = true

  if (electron && electron.exitCode === null) electron.kill()
  if (vite.exitCode === null) vite.kill()

  process.exitCode = code
}

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT

  while (Date.now() < deadline) {
    if (vite.exitCode !== null) {
      throw new Error(`Vite exited with code ${vite.exitCode} before the server was ready`)
    }

    try {
      const response = await fetch(DEV_URL, { signal: AbortSignal.timeout(1_000) })
      if (response.ok) return
    } catch {
      // Not listening yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error(`Vite did not answer on ${DEV_URL} within ${READY_TIMEOUT / 1_000}s`)
}

try {
  await waitForServer()
} catch (error) {
  console.error(error.message)
  stop(1)
}

if (!closing) {
  console.log(`\nLifeRPG desktop → ${DEV_URL}\n`)

  electron = spawn(electronPath, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, LIFERPG_DEV_URL: DEV_URL },
  })

  electron.on('close', (code) => stop(code ?? 0))
  vite.on('close', (code) => {
    if (!closing) {
      console.error('Vite stopped; closing the desktop window.')
      stop(code ?? 1)
    }
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => stop(0))
  }
}

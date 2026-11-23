import { describe, expect, it } from 'vitest'
import { INITIAL_UPDATER_STATE } from '../src/updater/updater-bridge'

/*
  The updater contract.

  The main process, the preload bridge and the renderer share channel names
  and one snapshot shape, and nothing imports the `.cjs` files: a renamed
  channel compiles, ships, and only fails at runtime as "No handler
  registered for liferpg:updater:check". The TypeScript interface is the
  contract, so the sources are read from disk and compared against it.

  Like `theme-contract.test.ts`, `node:fs` is assembled at runtime: tests run
  in jsdom and `@types/node` is not a dependency of this project.
*/
const FS = 'node:fs'
const fs = (await import(FS)) as {
  readFileSync: (path: string, encoding: 'utf8') => string
}

const ROOT = `${import.meta.dirname}/..`
const read = (file: string) => fs.readFileSync(`${ROOT}/${file}`, 'utf8')

const PRELOAD = read('electron/preload.cjs')
const MAIN = read('electron/main.cjs')
const UPDATER = read('electron/updater.cjs')
const BRIDGE = read('src/updater/updater-bridge.ts')

const matches = (source: string, pattern: RegExp): string[] =>
  [...source.matchAll(pattern)].map((match) => match[1])

describe('updater contract', () => {
  it('preload invokes exactly the channels the main process answers', () => {
    const invoked = matches(PRELOAD, /ipcRenderer\.invoke\('([^']+)'/g).sort()
    const handled = matches(MAIN, /ipcMain\.handle\('([^']+)'/g).sort()

    expect(invoked).toEqual(handled)
    expect(invoked).toHaveLength(4)
    expect(invoked.every((channel) => channel.startsWith('liferpg:updater:'))).toBe(
      true,
    )
  })

  it('uses one name per channel in both processes', () => {
    const stateChannel = matches(UPDATER, /const STATE_CHANNEL = '([^']+)'/g)[0]
    const checkChannel = matches(UPDATER, /const CHECK_REQUEST_CHANNEL = '([^']+)'/g)[0]

    expect(stateChannel).toBe('liferpg:updater:state')
    expect(checkChannel).toBe('liferpg:updater:request-check')
    expect(PRELOAD).toContain(`'${stateChannel}'`)
    expect(PRELOAD).toContain(`'${checkChannel}'`)
  })

  it('exposes every method of the renderer interface', () => {
    const body = BRIDGE.match(/export interface LifeRpgUpdater \{([\s\S]*?)\n\}/)
    expect(body).not.toBeNull()

    const methods = matches(body?.[1] ?? '', /^ {2}(\w+):/gm).sort()
    expect(methods).toEqual([
      'check',
      'download',
      'getState',
      'install',
      'onCheckRequested',
      'onState',
    ])

    for (const method of methods) {
      expect(PRELOAD, `preload is missing ${method}`).toContain(`\n    ${method}:`)
    }
  })

  it('keeps the snapshot shape in step with the initial state', () => {
    const initial = UPDATER.match(/let state = \{([\s\S]*?)\n {2}\}/)
    expect(initial).not.toBeNull()

    /* `currentVersion` is a shorthand property, hence the comma alternative. */
    const mainKeys = matches(initial?.[1] ?? '', /^ {4}(\w+)(?::|,)/gm).sort()
    expect(mainKeys).toEqual(Object.keys(INITIAL_UPDATER_STATE).sort())
  })
})

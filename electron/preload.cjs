/*
  Preload bridge.

  The renderer is sandboxed and context-isolated: it never sees `ipcRenderer`,
  `require` or the main process object. This file exposes one frozen, typed
  surface under `window.liferpg`, and each method maps to a single named IPC
  call — no channel name ever comes from the page.

  Keep it boring: an unsubscriber is returned from every `on*` method instead
  of handing the renderer a way to listen to arbitrary channels.
*/
const { contextBridge, ipcRenderer } = require('electron')

const STATE_CHANNEL = 'liferpg:updater:state'
const CHECK_REQUEST_CHANNEL = 'liferpg:updater:request-check'

/*
  One ipcRenderer listener per channel, fanned out to the subscribers. React
  StrictMode mounts effects twice, and a raw `ipcRenderer.on` per effect
  would leave a listener behind on the first unmount.
*/
function subscribe(channel) {
  const listeners = new Set()

  ipcRenderer.on(channel, (_event, payload) => {
    for (const listener of listeners) listener(payload)
  })

  return (listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }
}

const onState = subscribe(STATE_CHANNEL)
const onCheckRequested = subscribe(CHECK_REQUEST_CHANNEL)

contextBridge.exposeInMainWorld('liferpg', {
  updater: {
    getState: () => ipcRenderer.invoke('liferpg:updater:get-state'),
    check: () => ipcRenderer.invoke('liferpg:updater:check'),
    download: () => ipcRenderer.invoke('liferpg:updater:download'),
    install: () => ipcRenderer.invoke('liferpg:updater:install'),
    onState: (listener) => onState(listener),
    onCheckRequested: (listener) => onCheckRequested(listener),
  },
})

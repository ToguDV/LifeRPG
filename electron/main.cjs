/*
  Electron entry point. The renderer is the same Vite bundle as the web build:
  `dist/` once packaged, the Vite server during development.

  Why a custom protocol instead of `loadFile`: the bundle is ES modules, and
  Chromium refuses module scripts loaded from `file://` because the origin is
  opaque. `app://liferpg` is registered as standard and secure, so modules
  load and the renderer gets a normal origin for `localStorage` — the journal.
*/
const { mkdirSync } = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')
const { app, BrowserWindow, Menu, net, protocol, session, shell } = require('electron')

// Must match `appId` in electron-builder.yml.
const APP_ID = 'com.togudv.liferpg'
const SCHEME = 'app'
const HOST = 'liferpg'
const APP_ORIGIN = `${SCHEME}://${HOST}`

// `pnpm dev:desktop` sets this; a packaged build never does.
const DEV_URL = process.env.LIFERPG_DEV_URL || null
const RENDERER_ROOT = path.join(__dirname, '..', 'dist')

// A dev window gets its own profile: experimenting with the shell must not
// touch the journal the packaged app owns.
if (DEV_URL) {
  const devData = path.join(app.getPath('appData'), 'LifeRPG-dev')
  mkdirSync(devData, { recursive: true })
  app.setPath('userData', devData)
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

/*
  Maps a URL pathname onto `dist/`, refusing anything that escapes it. A path
  without an extension is a client route (`/`, `/gallery`) and is answered
  with `index.html`, the same SPA fallback a web server would apply.
*/
function resolveRequest(pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return null
  }

  const candidate = path.resolve(RENDERER_ROOT, `.${decoded}`)
  if (candidate === RENDERER_ROOT) {
    return { file: path.join(RENDERER_ROOT, 'index.html'), route: true }
  }
  if (!candidate.startsWith(RENDERER_ROOT + path.sep)) return null

  return { file: candidate, route: path.extname(candidate) === '' }
}

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain' } })
}

function serveAppRequest(request) {
  const { pathname } = new URL(request.url)
  const target = resolveRequest(pathname)
  if (!target) return notFound()

  const file = target.route ? path.join(RENDERER_ROOT, 'index.html') : target.file

  return net.fetch(pathToFileURL(file).toString()).catch(() => notFound())
}

function openExternal(url) {
  if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url)
}

function isInternal(url) {
  const base = new URL(DEV_URL || APP_ORIGIN)
  const target = new URL(url)
  return target.protocol === base.protocol && target.host === base.host
}

let mainWindow = null

function openRoute(route) {
  if (!mainWindow) return
  mainWindow.loadURL(`${DEV_URL || APP_ORIGIN}${route}`)
}

function buildMenu() {
  const isMac = process.platform === 'darwin'

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(isMac ? [{ role: 'appMenu' }] : []),
      {
        label: 'File',
        submenu: [
          {
            label: 'Open data folder',
            click: () => {
              const folder = app.getPath('userData')
              mkdirSync(folder, { recursive: true })
              void shell.openPath(folder)
            },
          },
          { type: 'separator' },
          { role: isMac ? 'close' : 'quit' },
        ],
      },
      { role: 'editMenu' },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
      { role: 'windowMenu' },
      {
        role: 'help',
        submenu: [
          { label: 'Component Codex', click: () => openRoute('/gallery') },
          { type: 'separator' },
          {
            label: 'LifeRPG on GitHub',
            click: () => openExternal('https://github.com/ToguDV/LifeRPG'),
          },
        ],
      },
    ]),
  )
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 360,
    minHeight: 480,
    show: false,
    title: 'LifeRPG',
    // Parchment, matching the default palette, so the first paint is not a black flash.
    backgroundColor: '#e6e0d0',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isInternal(url)) return
    event.preventDefault()
    openExternal(url)
  })

  mainWindow.loadURL(DEV_URL || `${APP_ORIGIN}/`)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  if (process.platform === 'win32') app.setAppUserModelId(APP_ID)

  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  app
    .whenReady()
    .then(() => {
      protocol.handle(SCHEME, serveAppRequest)
      // The journal needs no camera, microphone, notifications or clipboard
      // access; anything asking for one is not this app.
      session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
        callback(false)
      })
      session.defaultSession.setPermissionCheckHandler(() => false)

      buildMenu()
      createWindow()

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
      })
    })
    .catch((error) => {
      console.error('LifeRPG failed to start:', error)
      app.quit()
    })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}

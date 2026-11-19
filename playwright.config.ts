import { defineConfig, devices } from '@playwright/test'

/*
  Browser verification harness. It is deliberately small: one Chromium
  project, a Vite dev server on its own port and traces only when a test
  fails. Reports and traces live under `node_modules/.cache` so a local run
  never leaves tracked or untracked artifacts in the repository.

  The Chromium revision is pinned by `@playwright/test` itself. The version
  in `package.json` (1.64.1) matches the cached `chromium-1248` build, so
  `pnpm test:e2e` does not need to download a browser.
*/

const HOST = '127.0.0.1'
const PORT = 4317
const BASE_URL = `http://${HOST}:${PORT}`
const CACHE_DIR = 'node_modules/.cache'

export default defineConfig({
  testDir: './e2e',
  outputDir: `${CACHE_DIR}/liferpg-playwright-results`,
  fullyParallel: true,
  retries: 0,
  /*
    Not one worker per core. Each test drives a full Chromium over a ~9 000
    px gallery and axe walks the whole document, so the default half of the
    12 threads saturated every core for the whole run and left the machine
    unusable. Three workers keep the box responsive and only cost wall
    clock: `pnpm test:e2e --workers=1` is the quietest run, `--workers=6`
    the fastest.
  */
  workers: 3,
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: `${CACHE_DIR}/liferpg-playwright-report`,
        open: 'never' as const,
      },
    ],
  ],
  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    /*
      The gallery animates page transitions and toasts. Reduced motion keeps
      axe and the layout checks on the stable, final geometry.
    */
    reducedMotion: 'reduce',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --host ${HOST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

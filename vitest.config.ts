import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/*
  The tests mount real components, so the React plugin and a DOM are the only
  build-time pieces they need. The theme manifest plugin from `vite.config.ts`
  only rewrites `index.html`, which no test loads.
*/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    /* Globals stay explicit: `import { describe, it, expect } from 'vitest'`. */
    globals: false,
    restoreMocks: true,
    clearMocks: true,
    unstubGlobals: true,
  },
})

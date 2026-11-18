import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { THEMES, THEME_STORAGE_KEY } from './src/theme/themes'

/*
  The boot script in `index.html` runs before any module and cannot import
  `THEMES`, so `src/theme/themes.ts` is the single manifest and this plugin
  serialises it into the page shell for both `serve` and `build`. The script
  stays inline and synchronous, in `<head>`, before the first paint.
*/
const THEME_MANIFEST_MARKER = '__THEME_MANIFEST__'

function themeManifestPlugin(): Plugin {
  const manifest = JSON.stringify({
    storageKey: THEME_STORAGE_KEY,
    themes: THEMES.map((theme) => [theme.key, theme.paper]),
  }).replace(/</g, '\\u003c')

  return {
    name: 'liferpg-theme-manifest',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes(THEME_MANIFEST_MARKER)) {
          throw new Error(`index.html is missing the ${THEME_MANIFEST_MARKER} marker`)
        }

        return html.replace(THEME_MANIFEST_MARKER, () => manifest)
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), themeManifestPlugin()],
})

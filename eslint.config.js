import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/*
  Correctness and accessibility only. The repository has its own style (no
  semicolons, single quotes, two spaces) and it is not negotiable by a linter:
  no stylistic rule is enabled here, so `pnpm lint` never reformats the code.

  `js.configs.recommended` and the TypeScript configs cover real bugs;
  `jsx-a11y` covers the ARIA and JSX accessibility rules the review cares
  about; the React hooks rules keep `rules-of-hooks` at the error level and
  leave `exhaustive-deps` as a warning because several effects deliberately
  depend on a narrow slice of their inputs.
*/
export default tseslint.config(
  {
    ignores: ['dist/**', 'design/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      /*
        `autoFocus` here is a prop of our own wheel component, which moves
        focus into the dialog on the next frame; it is not the DOM attribute
        the rule is meant to catch.
      */
      'jsx-a11y/no-autofocus': ['error', { ignoreNonDOM: true }],
    },
  },
  {
    files: [
      'eslint.config.js',
      'vite.config.ts',
      'vitest.config.ts',
      'scripts/**/*.mjs',
      'electron/**/*.cjs',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // The main process is CommonJS by design: the `.cjs` extension makes
      // the module system explicit regardless of the package's `type: module`.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
)

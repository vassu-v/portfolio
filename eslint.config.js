import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'public', 'src/three/room/lib']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // r3f scene code mutates three.js objects inside useFrame by design, and
    // shares layout constants (DESK, BOARD, anchors) between scene modules.
    files: ['src/three/room/**/*.{js,jsx}'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
])

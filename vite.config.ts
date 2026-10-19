import { defineConfig } from 'vitest/config'
import preact from '@preact/preset-vite'
import { BASE_PATH } from './site.config.ts'

export default defineConfig({
  base: BASE_PATH,
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    css: false,
    // 排除 Playwright E2E 用例（由 `npm run test:e2e` 单独运行）
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'tests/e2e/**',
      'playwright.config.ts',
    ],
  },
});

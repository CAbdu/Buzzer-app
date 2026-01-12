import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['<rootDir>/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.git',
      'coverage',
      'test/fixtures'
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*'],
      exclude: [
        'src/index.ts',
        'src/main.ts',
        'src/App.tsx',
        'src/firebase.ts',
        'test/**/*'
      ],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage'
    },
    // Optional: enable watch mode for development
    watch: false,
    // Optional: parallelize tests (useful for large test suites)
    parallel: true,
    // Optional: run tests in a specific environment
    browser: {
      enabled: true,
      headless: true,
      name: 'chromium'
    }
  }
})
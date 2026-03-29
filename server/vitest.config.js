import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: './tests/globalSetup.js',
    setupFiles: ['./tests/setup.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run test files sequentially and share the module registry so Mongoose
    // models are only registered once (avoids OverwriteModelError).
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    isolate: false,
    reporter: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['app/**/*.js'],
      exclude: ['app/config/**', 'app/services/**', 'app/models/**'],
    },
  },
});

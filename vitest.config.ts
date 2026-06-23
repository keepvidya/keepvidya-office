import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**', 'src/adapters/**'],
      // ports.ts is type-only (no runtime); dom-theme is a thin DOM wrapper
      // exercised by the e2e theme test (TC-00.3.4), not unit-coverable in node.
      exclude: ['src/domain/ports.ts', 'src/adapters/theme/dom-theme.ts'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});

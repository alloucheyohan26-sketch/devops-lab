/**
 * Vitest configuration.
 * Vitest does not read settings from package.json, so the coverage
 * thresholds must live here to actually fail CI below 80%.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/index.js'], // server entry point, not used by tests
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80
      }
    }
  }
})

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    resolve: {
        alias: [
            {
                find: /^\/src\//,
                replacement: fileURLToPath(new URL('./src/', import.meta.url))
            }
        ]
    },
    test: {
        environment: 'happy-dom',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reportsDirectory: fileURLToPath(new URL('./ai-drafts/test-results/coverage', import.meta.url))
        }
    }
})

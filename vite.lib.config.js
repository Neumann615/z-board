import {resolve} from 'path'
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        dts({
            insertTypesEntry: true,
            outDir: 'lib',
            include: ['src/index.ts', 'src/modules/**/*.ts', 'src/components/**/*.ts', 'src/types/**/*.ts', 'src/utils/**/*.ts'],
            exclude: ['src/main.ts', 'src/styles/**', 'src/assets/**', '**/html2canvas.esm.ts'],
            rollupTypes: true,
            cleanVueOutDir: true,
            copyDtsFiles: true
        })
    ],
    resolve: {
        alias: {
            "/src/": resolve(__dirname, 'src')
        }
    },
    build: {
        copyPublicDir: false,
        terserOptions: {compress: {drop_console: true, drop_debugger: true}},
        emptyOutDir: true,
        brotliSize: false,
        write: true,
        cssCodeSplit: false,
        sourcemap: false,
        minify: "esbuild",
        outDir: "lib",
        rollupOptions: {
            external: (id) => {
                if (id.startsWith('msg-alert') || id.startsWith('js-web-screen-shot') || id.startsWith('html2canvas')) {
                    return true
                }
                return false
            }
        },
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ["es", "cjs"],
            name: "z-board",
            fileName: (format) => `z-board.${format}.js`
        }
    }
})

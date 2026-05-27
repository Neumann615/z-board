import {resolve} from 'path'
import {defineConfig} from 'vite'

export default defineConfig({
    resolve: {
        alias: {
            "/@/": resolve(__dirname, 'src')
        }
    },
    build: {
        //清除console和debugger
        terserOptions: {compress: {drop_console: true, drop_debugger: true}},
        emptyOutDir: true,
        // 启用 / 禁用 brotli 压缩大小报告
        brotliSize: true,
        write: true,
        cssCodeSplit: false,
        assetsDir: "../assets",
        sourcemap: false,
        minify: "esbuild",
        outDir:"lib",
        lib: {
            entry: [resolve(__dirname, 'src/index.js')],
            formats: ["es", "cjs", "iife", "umd", "amd", "system"],
            name: "z-board",
            fileName: 'z-board'
        }
    }
})

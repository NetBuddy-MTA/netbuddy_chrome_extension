import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

const entryPoints = {
  // main
  main: path.resolve(__dirname, 'index.html'),
  // background service
  background: path.resolve(__dirname, 'src/background/executor_service.ts'),
  // content script
  content: path.resolve(__dirname, 'src/content/content_script.ts'),
  selector_generator: path.resolve(__dirname, 'src/content/selector_generator.ts'),
  netbuddy_content: path.resolve(__dirname, 'src/content/netbuddy_content.ts')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false,
    rollupOptions: {
      input: entryPoints,
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]',
        chunkFileNames: '[name].js',
      }
    }
  }
})

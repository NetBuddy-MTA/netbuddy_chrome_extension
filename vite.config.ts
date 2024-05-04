import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

const entryPoints = {
  main: path.resolve(__dirname, 'index.html'),
  background: path.resolve(__dirname, 'src/background_service.ts')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: entryPoints
    }
  }
})

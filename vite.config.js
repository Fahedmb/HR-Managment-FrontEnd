import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // sockjs-client requires the Node.js `global` object — polyfill it for the browser
    global: 'globalThis',
  },
})

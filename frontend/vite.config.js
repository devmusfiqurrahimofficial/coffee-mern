import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { API_KEY } = loadEnv(mode, process.cwd(), 'API_KEY')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.API_KEY': JSON.stringify(API_KEY),
    },
  }
})

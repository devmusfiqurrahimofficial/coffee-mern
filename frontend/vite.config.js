import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { cwd } from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { API_KEY } = loadEnv(mode, cwd(), 'API_KEY')
  const { FIREBASE_API_KEY } = loadEnv(mode, cwd(), 'FIREBASE_API_KEY')

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'import.meta.env.API_KEY': JSON.stringify(API_KEY),
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(FIREBASE_API_KEY ?? ''),
    },
  }
})

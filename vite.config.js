import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/rotinas-ti-app/' : '/',
  define: {
    '__firebase_config': JSON.stringify(process.env.FIREBASE_CONFIG || '{}'),
    '__app_id': JSON.stringify(process.env.APP_ID || 'rotinas-ti-app'),
    '__initial_auth_token': JSON.stringify(process.env.INITIAL_AUTH_TOKEN || '')
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
})

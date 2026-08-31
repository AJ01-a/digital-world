import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths, so the build works from a user page
  // (username.github.io) or a project page (username.github.io/repo)
  // without any extra configuration.
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    // The project lives on a Windows drive under WSL, where inotify events
    // do not fire — polling keeps hot reload working.
    watch: { usePolling: true, interval: 300 },
  },
  build: {
    target: 'es2020',
    cssMinify: 'lightningcss',
  },
})

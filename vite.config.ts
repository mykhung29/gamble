import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Build ra 1 file dist/index.html duy nhất -> bấm đúp là chơi, không cần server
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  base: './',
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: {
      overlay: false, // Esto desactiva el logo de la V y los avisos de error en pantalla
    }
  }
})

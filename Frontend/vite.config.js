import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    hmr: {
      overlay: false, // Esto desactiva el logo de la V y los avisos de error en pantalla
    }
  }
})

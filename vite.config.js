import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PENTING untuk cPanel: base relatif ('./') supaya build tetap jalan
  // walau di-upload ke subfolder (mis. public_html/wms/), bukan cuma root domain.
  base: './',
  build: {
    outDir: 'dist',
  },
});

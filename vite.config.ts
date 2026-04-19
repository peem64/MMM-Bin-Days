import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const envDir = resolve(__dirname);
  const env = { ...process.env, ...loadEnv(mode, envDir, '') };
  return {
    plugins: [react()],
    envDir,
    envPrefix: ['VITE_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL ?? ''),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY ?? ''),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});

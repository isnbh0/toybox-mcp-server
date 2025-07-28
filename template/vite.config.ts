import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    // Use base path only in production (GitHub Pages)
    base: isProduction ? '/YOUR_REPO_NAME/' : '/',
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'src': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    build: {
      // Ensure subdirectory-based artifacts are properly handled in the build process
      rollupOptions: {
        // Preserve directory structure for artifacts
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'mermaid-vendor': ['mermaid']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Generate source maps for better debugging
      sourcemap: true,
    },
    // Optimize development server for better artifact loading
    server: {
      fs: {
        strict: false, // Allow serving files from outside the root directory
      },
      hmr: {
        overlay: true, // Show errors as overlay
      },
    },
  }
})

import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@react-three/fiber',
      '@react-three/drei',
      'three',
      'antd'
    ],
    exclude: [
      // Exclude three-vrm packages from optimization to avoid resolution issues
      '@pixiv/three-vrm-core',
      '@pixiv/three-vrm-springbone',
      '@pixiv/three-vrm-materials-mtoon',
      '@pixiv/three-vrm-node-constraint',
      '@pixiv/three-vrm-materials-hdr-emissive-multiplier'
    ],
    // Exclude problematic example directories from scanning
    entries: [
      'src/**/*.{js,ts,jsx,tsx}',
      '!modules/external/three-vrm/packages/*/examples.disabled/**',
      '!modules/external/**/examples/**',
      '!modules/external/**/examples.disabled/**'
    ]
  },
  resolve: {
    alias: {
      // Provide fallbacks for missing three.js WebGPU exports
      'three/webgpu': 'three',
      
      // Map three-vrm packages to their built modules
      '@pixiv/three-vrm-core': path.resolve(__dirname, 'modules/external/three-vrm/packages/three-vrm-core/lib/three-vrm-core.module.js'),
      '@pixiv/three-vrm-springbone': path.resolve(__dirname, 'modules/external/three-vrm/packages/three-vrm-springbone/lib/three-vrm-springbone.module.js'),
      '@pixiv/three-vrm-materials-mtoon': path.resolve(__dirname, 'modules/external/three-vrm/packages/three-vrm-materials-mtoon/lib/three-vrm-materials-mtoon.module.js'),
      '@pixiv/three-vrm-node-constraint': path.resolve(__dirname, 'modules/external/three-vrm/packages/three-vrm-node-constraint/lib/three-vrm-node-constraint.module.js'),
      '@pixiv/three-vrm-materials-hdr-emissive-multiplier': path.resolve(__dirname, 'modules/external/three-vrm/packages/three-vrm-materials-hdr-emissive-multiplier/lib/three-vrm-materials-hdr-emissive-multiplier.module.js')
    }
  },
  build: {
    rollupOptions: {
      external: (id) => {
        // Don't bundle three-vrm example files
        return id.includes('examples.disabled')
      }
    }
  }
}) 
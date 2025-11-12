import type { NextConfig } from 'next'
import { withBotId } from 'botid/next/config'

const nextConfig: NextConfig = {
  // Phase 3.1.1: Frontend Performance Optimization
  // Enable compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Optimize bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'react-markdown',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
    ],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.md/,
      type: 'asset/source',
    })
    
    // Phase 3.1.1: Optimize production builds
    if (process.env.NODE_ENV === 'production') {
      config.optimization.usedExports = true
      config.optimization.sideEffects = true
    }
    
    return config
  },
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'vercel.com',
        port: '',
        pathname: '/api/www/avatar/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default withBotId(nextConfig)

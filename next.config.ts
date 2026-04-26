import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**', pathname: '/**' }],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig

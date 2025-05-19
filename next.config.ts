import path from 'path'
import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // ✅ 여기 추가!
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
}

export default nextConfig

import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true, // ✅ 빌드 시 ESLint 에러 무시
  },
  images: {
    domains: ['whhzgmbuqpsjhhkoywif.supabase.co'], // ✅ Supabase 스토리지 도메인 등록
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

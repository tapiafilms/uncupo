import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No prerenderizar páginas que dependen de auth/DB
  output: undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig

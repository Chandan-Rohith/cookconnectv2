import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // allow Supabase Storage images
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com', // allow Unsplash images
      },
      // Add more domains here as needed
    ],
  },
}

export default nextConfig

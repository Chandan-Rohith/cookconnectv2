import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // allow Supabase Storage images
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com', // allow YouTube thumbnails
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

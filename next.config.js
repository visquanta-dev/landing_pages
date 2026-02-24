/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.unsplash.com' },
      { protocol: 'https', hostname: '*.toyota.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

module.exports = nextConfig

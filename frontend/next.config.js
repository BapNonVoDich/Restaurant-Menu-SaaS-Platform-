/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  },
  // Prevent ENOENT errors by ensuring proper build output
  generateBuildId: async () => {
    // Use a consistent build ID to avoid manifest issues
    return 'build-' + Date.now()
  },
  // Ensure proper file watching
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Improve file watching in development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    return config
  },
}

module.exports = nextConfig

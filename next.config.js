/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname),
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:6001'],
    },
  },
}

module.exports = nextConfig


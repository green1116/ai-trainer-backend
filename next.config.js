/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname),
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:6001',
        // Vercel 部署环境
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        process.env.NEXT_PUBLIC_APP_URL || '',
      ].filter(Boolean),
    },
  },
}

module.exports = nextConfig


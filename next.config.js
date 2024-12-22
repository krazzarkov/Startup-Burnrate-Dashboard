/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_DOCKER_BUILD: process.env.NEXT_PUBLIC_DOCKER_BUILD,
  },
}

module.exports = nextConfig


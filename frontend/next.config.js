/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ox (viem dependency) has type errors incompatible with the installed TS version
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

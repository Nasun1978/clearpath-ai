/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output bundles all dependencies for the Electron desktop build
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: { domains: [] },
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

module.exports = nextConfig;

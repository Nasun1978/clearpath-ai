/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: { domains: [] },
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
};

module.exports = nextConfig;

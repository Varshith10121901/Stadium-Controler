const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export',  // Only enable for static Firebase Hosting deploy
  // trailingSlash: true, // Only enable for static Firebase Hosting deploy
  images: { unoptimized: true },
  experimental: {
    turbo: {
      root: path.resolve(__dirname),
    },
  },
};
module.exports = nextConfig;

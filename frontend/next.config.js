/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export',  // Only enable for static Firebase Hosting deploy
  // trailingSlash: true, // Only enable for static Firebase Hosting deploy
  images: { unoptimized: true },
};
module.exports = nextConfig;

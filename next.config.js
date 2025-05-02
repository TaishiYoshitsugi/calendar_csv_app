/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      type: 'asset/resource'
    });
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer']
  }
}

module.exports = nextConfig 
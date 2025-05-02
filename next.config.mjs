/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(ttf|woff|woff2|eot)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });
    return config;
  },
  // サーバーサイドのエラーを防ぐための設定
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  // パフォーマンス最適化
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
}

export default nextConfig 
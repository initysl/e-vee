import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  distDir: '.next-local',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
        pathname: '/img/**',
      },
    ],
  },
};

export default nextConfig;

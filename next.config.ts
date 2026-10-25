import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  async redirects() {
    // Profielpagina's stonden kort onder /v/; oude links blijven werken.
    return [
      // De uitlegpagina op kattenverzorging.com is de enige landingspagina voor Nestje.
      { source: '/', destination: 'https://www.kattenverzorging.com/nestje/', permanent: true },
      { source: '/v/:slug', destination: '/van/:slug', permanent: true },
      { source: '/inlog', destination: '/login', permanent: true },
      { source: '/inloggen', destination: '/login', permanent: true },
    ];
  },
};

export default nextConfig;

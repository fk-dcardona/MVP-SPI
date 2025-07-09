const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Optimize production builds
  productionBrowserSourceMaps: false,
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
    // Enable server components optimization
    serverComponentsExternalPackages: ['@tremor/react'],
  },
  
  // Configure image optimization
  images: {
    domains: ['supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Webpack configuration for bundle optimization
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            commons: {
              name: 'commons',
              chunks: 'all',
              minChunks: 2,
            },
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            radixui: {
              name: 'radixui',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/](recharts|d3-.*)[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            lib: {
              test(module) {
                return module.size() > 160000 && /node_modules/.test(module.identifier());
              },
              name(module) {
                const packageName = module.identifier().match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `lib.${packageName.replace('@', '')}`;
              },
              priority: 15,
              minChunks: 1,
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Tree shake lucide-react icons
      config.resolve.alias = {
        ...config.resolve.alias,
        'lucide-react': 'lucide-react/dist/esm/icons',
      };
    }
    
    return config;
  },
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Redirect www to non-www
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.finkargo-analytics.com',
          },
        ],
        destination: 'https://finkargo-analytics.com/:path*',
        permanent: true,
      },
    ];
  },
  
  // Configure module transpilation
  transpilePackages: ['lucide-react'],
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
};

module.exports = withBundleAnalyzer(nextConfig);
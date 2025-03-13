/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  webpack: (config, { isServer }) => {
    // Add PDF handling from .ts config
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfkit': 'pdfkit/js/pdfkit.js'
    };
    
    // Non-server specific configs
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        path: false,
        crypto: false
      };
    }
    
    // Font handling from both configs
    config.module.rules.push({
      test: /\.(afm|ttf|woff|woff2|otf)$/,
      use: 'null-loader',
      type: 'javascript/auto'
    });
    
    return config;
  },
  images: {
    domains: [
      'uxbakpeeqydatgvdyaa.supabase.co',
      'img.youtube.com',
      'i.vimeocdn.com',
      'https://www.fayfort.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      }
    ]
  },
  output: 'standalone',
}

module.exports = nextConfig 
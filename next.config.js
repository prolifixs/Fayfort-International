/** @type {import('next').NextConfig} */
const nextConfig = {
  // Placeholder fallbacks so the build never crashes for missing credentials —
  // real backend wiring (Stripe/Supabase) is deferred to the later ERP/CRM pass.
  // Replace these with real values (locally or on Vercel) whenever that happens.
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://www.fayfort.com',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
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
      'www.fayfort.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      }
    ]
  },
  output: 'standalone',
  async rewrites() {
    // FaySource is live at faysource-nine.vercel.app (already built with a
    // matching /products/fay basePath). Defaulting to it here means this works
    // without needing Vercel dashboard access to set an env var — override
    // FAYSOURCE_ZONE_URL later if it ever moves to a different deployment.
    const faysourceZone = process.env.FAYSOURCE_ZONE_URL || 'https://faysource-nine.vercel.app';
    if (!faysourceZone) return { beforeFiles: [] };

    return {
      beforeFiles: [
        { source: '/products/fay', destination: `${faysourceZone}/products/fay` },
        { source: '/products/fay/:path*', destination: `${faysourceZone}/products/fay/:path*` },
      ],
    };
  },
}

module.exports = nextConfig 
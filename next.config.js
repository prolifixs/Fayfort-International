const SUPABASE_HOST = 'uxbakpeeqydatgvvdyaa.supabase.co'
const SHOPIFY_STORE = 'https://8kjjz9-ei.myshopify.com'

// Allowlist of what the pages load. Next.js injects inline bootstrap scripts, so
// script-src needs 'unsafe-inline' until a nonce-based CSP is set up; dev mode
// also needs 'unsafe-eval' for fast refresh.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://sdks.shopifycdn.com https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://cdn.shopify.com https://${SUPABASE_HOST} https://img.youtube.com https://i.vimeocdn.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${SHOPIFY_STORE} https://monorail-edge.shopifysvc.com https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://api.stripe.com`,
  `frame-src ${SHOPIFY_STORE} https://js.stripe.com https://hooks.stripe.com https://www.youtube.com https://player.vimeo.com`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${SHOPIFY_STORE}`,
  "frame-ancestors 'none'",
].join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
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
    // Exact hosts only: the image optimizer fetches whatever these patterns allow.
    remotePatterns: [
      { protocol: 'https', hostname: SUPABASE_HOST },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
    ],
  },
  output: 'standalone',
  async redirects() {
    // While FaySource is closed, send anyone who reaches it back to the homepage.
    if (process.env.FAYSOURCE_ZONE_URL) return [];
    return [
      { source: '/products/fay', destination: '/', permanent: false },
      { source: '/products/fay/:path*', destination: '/', permanent: false },
    ];
  },
  async rewrites() {
    // FaySource is closed for now: /products/fay is only proxied to the FaySource
    // deployment (built with a matching /products/fay basePath) when
    // FAYSOURCE_ZONE_URL is set, e.g. https://faysource-nine.vercel.app.
    const faysourceZone = process.env.FAYSOURCE_ZONE_URL;
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
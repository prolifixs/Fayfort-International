import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfkit': 'pdfkit/js/pdfkit.js'
    };
    
    // Completely ignore font-related files
    config.module.rules.push({
      test: /\.(afm|ttf|woff|woff2|otf)$/,
      use: 'null-loader',
      type: 'javascript/auto'
    });
    
    return config;
  }
};

export default nextConfig;

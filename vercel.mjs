const apiProxyOrigin = process.env.STOREFRONT_API_PROXY_ORIGIN?.trim().replace(/\/+$/, '');

if (!apiProxyOrigin) {
  throw new Error(
    'Defina STOREFRONT_API_PROXY_ORIGIN com a origem pública da API na Vercel.',
  );
}

let parsedApiOrigin;
try {
  parsedApiOrigin = new URL(apiProxyOrigin);
} catch {
  throw new Error('STOREFRONT_API_PROXY_ORIGIN deve ser uma URL absoluta válida.');
}

if (parsedApiOrigin.protocol !== 'https:') {
  throw new Error('STOREFRONT_API_PROXY_ORIGIN deve usar https.');
}

export const config = {
  framework: null,
  buildCommand:
    'node tools/generate-storefront-runtime-config.mjs && npx nx run storefront:build:production',
  outputDirectory: 'dist/packages/storefront/browser',
  rewrites: [
    {
      source: '/api/:path*',
      destination: `${apiProxyOrigin}/api/:path*`,
    },
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
};

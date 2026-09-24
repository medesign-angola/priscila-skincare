import { routes, type VercelConfig } from '@vercel/config/v1';

const apiProxyOrigin = process.env.STOREFRONT_API_PROXY_ORIGIN?.trim().replace(
  /\/+$/,
  '',
);

if (!apiProxyOrigin) {
  throw new Error(
    'Defina STOREFRONT_API_PROXY_ORIGIN com a origem pública da API na Vercel.',
  );
}

let parsedApiOrigin: URL;
try {
  parsedApiOrigin = new URL(apiProxyOrigin);
} catch {
  throw new Error(
    'STOREFRONT_API_PROXY_ORIGIN deve ser uma URL absoluta válida.',
  );
}

if (parsedApiOrigin.protocol !== 'https:') {
  throw new Error('STOREFRONT_API_PROXY_ORIGIN deve usar https.');
}

export const config: VercelConfig = {
  framework: null,
  buildCommand:
    'node tools/generate-storefront-runtime-config.mjs && npx nx run storefront:build:production',
  outputDirectory: 'dist/packages/storefront/browser',
  rewrites: [
    routes.rewrite('/api/:path*', `${apiProxyOrigin}/api/:path*`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
};

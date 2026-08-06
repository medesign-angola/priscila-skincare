import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaults = {
  apiUrl: 'http://localhost:5041/api/v1',
  cmsUrl: 'http://localhost:1337',
};

const isVercelBuild = process.env.VERCEL === '1';
const configuredApiUrl = process.env.STOREFRONT_API_URL?.trim();
const configuredCmsUrl = process.env.STOREFRONT_CMS_URL?.trim();

if (isVercelBuild && (!configuredApiUrl || !configuredCmsUrl)) {
  throw new Error(
    'Defina STOREFRONT_API_URL e STOREFRONT_CMS_URL nas variáveis de ambiente da Vercel.',
  );
}

function normalizeHttpUrl(name, value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} deve ser uma URL absoluta válida.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`${name} deve usar http ou https.`);
  }

  return value.replace(/\/+$/, '');
}

const config = {
  apiUrl: normalizeHttpUrl(
    'STOREFRONT_API_URL',
    configuredApiUrl || defaults.apiUrl,
  ),
  cmsUrl: normalizeHttpUrl(
    'STOREFRONT_CMS_URL',
    configuredCmsUrl || defaults.cmsUrl,
  ),
  useMockFallbacks:
    process.env.STOREFRONT_USE_MOCK_FALLBACKS?.trim().toLowerCase() ===
    'true',
};

const currentFile = fileURLToPath(import.meta.url);
const outputPath = resolve(
  dirname(currentFile),
  '../packages/storefront/public/runtime-config.js',
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  `window.__PRISCILA_SKINCARE_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
  'utf8',
);

console.log(
  `Storefront configurado para API ${config.apiUrl} e CMS ${config.cmsUrl}.`,
);

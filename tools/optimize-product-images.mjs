import { readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const productsDirectory = path.resolve(
  'packages/storefront/public/assets/images/products',
);
const maxDimension = 2560;
const webpQuality = 82;

const entries = await readdir(productsDirectory, { withFileTypes: true });
const sourceFiles = entries
  .filter((entry) => entry.isFile() && /\.jpe?g$/i.test(entry.name))
  .map((entry) => entry.name)
  .sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true }),
  );

if (sourceFiles.length === 0) {
  console.log('No JPG product images found.');
  process.exit(0);
}

let originalBytes = 0;
let optimizedBytes = 0;

for (const sourceName of sourceFiles) {
  const sourcePath = path.join(productsDirectory, sourceName);
  const targetName = sourceName.replace(/\.jpe?g$/i, '.webp');
  const targetPath = path.join(productsDirectory, targetName);
  const sourceStats = await stat(sourcePath);

  const existingTarget = await stat(targetPath).catch(() => null);
  if (existingTarget) {
    await unlink(sourcePath);
    console.log(
      `Removed ${sourceName}: the optimized ${targetName} already exists.`,
    );
    continue;
  }

  await sharp(sourcePath)
    .rotate()
    .resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: webpQuality, effort: 6, smartSubsample: true })
    .toFile(targetPath);

  const [metadata, targetStats] = await Promise.all([
    sharp(targetPath).metadata(),
    stat(targetPath),
  ]);

  if (metadata.format !== 'webp') {
    throw new Error(`${targetName} was not encoded as WebP.`);
  }

  originalBytes += sourceStats.size;
  optimizedBytes += targetStats.size;
  await unlink(sourcePath);

  const reduction = (1 - targetStats.size / sourceStats.size) * 100;
  console.log(
    `${sourceName} -> ${targetName}: ${formatBytes(sourceStats.size)} -> ${formatBytes(targetStats.size)} (${reduction.toFixed(1)}% smaller)`,
  );
}

console.log(
  `Converted total: ${formatBytes(originalBytes)} -> ${formatBytes(optimizedBytes)} (${((1 - optimizedBytes / originalBytes) * 100).toFixed(1)}% smaller)`,
);

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

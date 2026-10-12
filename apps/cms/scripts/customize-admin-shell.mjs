import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const indexPath = resolve('dist/build/index.html');
const original = await readFile(indexPath, 'utf8');
const customized = original
  .replace(/<html lang="[^"]*">/, '<html lang="pt">')
  .replace(
    /<title>[^<]*<\/title>/,
    '<title>Priscila Skincare — Administração</title>',
  );

if (customized === original) {
  throw new Error(`Não foi possível personalizar o shell do admin em ${indexPath}.`);
}

await writeFile(indexPath, customized, 'utf8');
console.log('Admin shell personalizado: título e idioma inicial atualizados.');

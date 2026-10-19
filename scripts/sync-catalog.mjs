try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { validateCatalog } from './validate-catalog.mjs';
await mkdir('.astro', { recursive: true });
const local = JSON.parse(await readFile('src/data/catalog.json', 'utf8'));
validateCatalog(local);
let selected = local;
const app = process.env.PUBLIC_APP_URL;
if (app) {
  try {
    const response = await fetch(`${app.replace(/\/$/, '')}/api/public/catalog`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const candidate = await response.json();
    validateCatalog(candidate);
    selected = candidate;
    console.log('Catalog: platform API');
  } catch (error) {
    console.warn(`Catalog API unavailable (${error.message}); using local catalog.`);
  }
} else console.log('Catalog: local preview data (platform not configured)');
await writeFile('.astro/catalog.json', JSON.stringify(selected, null, 2));

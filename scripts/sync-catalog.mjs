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
// Keep the confirmed WHOOP launch visible even if the API returns an older snapshot.
const whoop = local.services.find((service) => service.id === 'whoop');
if (whoop?.status === 'available' && selected !== local) {
  selected = {
    ...selected,
    services: selected.services.some((service) => service.id === 'whoop')
      ? selected.services.map((service) =>
          service.id === 'whoop' ? { ...service, status: 'available' } : service,
        )
      : [...selected.services, whoop],
  };
}
await writeFile('.astro/catalog.json', JSON.stringify(selected, null, 2));

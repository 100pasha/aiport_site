try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
import { writeFile, copyFile } from 'node:fs/promises';
const url = new URL(process.env.PUBLIC_SITE_URL || 'https://aiport.example');
if (url.hostname !== 'aiport.example' && !url.hostname.endsWith('.github.io'))
  await writeFile('dist/CNAME', url.hostname + '\n');
await writeFile('dist/.nojekyll', '');

await copyFile('dist/sitemap-0.xml', 'dist/sitemap.xml');

try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
import { writeFile, copyFile, rm } from 'node:fs/promises';
const url = new URL(process.env.PUBLIC_SITE_URL || 'https://ligos.ru');
if (!url.hostname.endsWith('.github.io')) {
  await writeFile('dist/CNAME', url.hostname + '\n');
} else {
  // A project Pages test build must not retain the custom-domain CNAME copied from public/.
  await rm('dist/CNAME', { force: true });
}
await writeFile('dist/.nojekyll', '');
await copyFile('dist/sitemap-0.xml', 'dist/sitemap.xml');

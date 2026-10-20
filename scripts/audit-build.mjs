try {
  process.loadEnvFile('.env');
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function walk(dir) {
  const result = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, e.name);
    if (e.isDirectory()) result.push(...(await walk(path)));
    else result.push(path);
  }
  return result;
}
const files = await walk('dist');
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const known = new Set(files);
const titles = new Set();
const descriptions = new Set();
let links = 0;
const base = new URL(process.env.PUBLIC_SITE_URL || 'https://ligos.io').pathname.replace(/\/$/, '');
function pathExists(path) {
  if (base) {
    if (!path.startsWith(base + '/') && path !== base) return false;
    path = path.slice(base.length) || '/';
  }
  return (
    known.has('dist' + path) ||
    known.has('dist' + path + 'index.html') ||
    known.has('dist' + path + '/index.html') ||
    known.has('dist' + path + '.html')
  );
}
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  assert(title, `Missing title: ${file}`);
  assert(!titles.has(title), `Duplicate title: ${file}`);
  titles.add(title);
  assert(description, `Missing description: ${file}`);
  assert(!descriptions.has(description), `Duplicate description: ${file}`);
  descriptions.add(description);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `Expected one H1: ${file}`);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[^\"]*)"/g)) {
    const path = decodeURIComponent(match[1]);
    if (path.startsWith('//')) continue;
    assert(pathExists(path), `Broken local resource ${path} in ${file}`);
    links++;
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))
    JSON.parse(match[1]);
}
const kb = JSON.parse(await readFile('dist/kb.json', 'utf8'));
assert.equal(kb.articles.length, 33);
for (const article of kb.articles) {
  assert(article.text.trim().length > 50);
  assert(pathExists(new URL(article.url).pathname));
  for (const image of article.images) assert(pathExists(new URL(image).pathname));
}
for (const file of [
  'dist/rss.xml',
  'dist/robots.txt',
  'dist/sitemap.xml',
  'dist/sitemap-index.xml',
  'dist/.nojekyll',
])
  assert(known.has(file), `Missing ${file}`);
console.log(
  `Verified ${htmlFiles.length} HTML pages, ${links} internal references and ${kb.articles.length} knowledge-base articles.`,
);

try {
  process.loadEnvFile('.env');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
const domain = new URL(process.env.PUBLIC_SITE_URL || 'https://aiport.example');
const base = domain.pathname.replace(/\/$/, '');
// Markdown image/link URLs use the same prefix as Astro components.
function prefixContentLinks() {
  return (tree) => {
    function visit(node) {
      if (node.properties) {
        for (const key of ['src', 'href']) {
          const value = node.properties[key];
          if (
            typeof value === 'string' &&
            value.startsWith('/') &&
            !value.startsWith('//') &&
            base &&
            !value.startsWith(base + '/')
          )
            node.properties[key] = base + value;
        }
      }
      node.children?.forEach(visit);
    }
    visit(tree);
  };
}
export default defineConfig({
  site: domain.origin,
  base: base || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { rehypePlugins: [prefixContentLinks] },
  vite: { server: { allowedHosts: true } },
});

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { config, absoluteUrl } from '../lib/config';
export async function GET() {
  const posts = await getCollection('blog');
  return rss({
    title: `Блог ${config.brand}`,
    description: 'О данных, ИИ и спокойном управлении бизнесом.',
    site: config.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.date,
      link: absoluteUrl(`/blog/${p.id}/`),
    })),
  });
}

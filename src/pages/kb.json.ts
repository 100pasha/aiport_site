import { getCollection } from 'astro:content';
import { absoluteUrl } from '../lib/config';
export async function GET() {
  const services = await getCollection('services'),
    ai = await getCollection('ai'),
    faq = await getCollection('faq');
  const articles = [
    ...services.map((a) => ({ ...a, url: `/katalog/${a.data.service_id}/` })),
    ...ai.map((a) => ({ ...a, url: `/podklyuchit/${a.data.client_id}/` })),
    ...faq.map((a) => ({ ...a, url: `/voprosy/#faq-${a.id}` })),
  ].map((a) => ({
    id: a.id,
    title: a.data.title,
    description: a.data.description,
    updated: a.data.updated.toISOString(),
    service_id: a.data.service_id,
    client_id: a.data.client_id,
    url: absoluteUrl(a.url),
    text: a.body || '',
    images: [...(a.body || '').matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => absoluteUrl(m[1])),
  }));
  return new Response(
    JSON.stringify(
      {
        version: 1,
        updated_at: new Date(
          Math.max(...articles.map((a) => new Date(a.updated).getTime())),
        ).toISOString(),
        articles,
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
}

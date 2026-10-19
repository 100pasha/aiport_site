import { absoluteUrl, withBase } from '../lib/config';
export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: ${withBase('/platform/')}\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}

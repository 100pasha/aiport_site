export const config = {
  brand: import.meta.env.PUBLIC_BRAND || 'Ligos',
  site: (import.meta.env.PUBLIC_SITE_URL || 'https://ligos.ru').replace(/\/$/, ''),
  app: (import.meta.env.PUBLIC_APP_URL || '').replace(/\/$/, ''),
  email: import.meta.env.PUBLIC_SUPPORT_EMAIL || '',
  ymId: import.meta.env.PUBLIC_YM_ID || '',
  legalName: import.meta.env.PUBLIC_LEGAL_NAME || '',
  inn: import.meta.env.PUBLIC_LEGAL_INN || '',
  ogrnip: import.meta.env.PUBLIC_LEGAL_OGRNIP || '',
  verification: import.meta.env.PUBLIC_YANDEX_VERIFICATION || '',
  securityVerified: import.meta.env.PUBLIC_SECURITY_VERIFIED === 'true',
};
// Keep both a custom domain and GitHub project Pages working from the same source.
export const withBase = (path: string) => {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base || path === base || path.startsWith(base + '/')) return path;
  return base + path;
};
export const absoluteUrl = (path: string) => new URL(withBase(path), config.site).href;
export const appLink = (path: string) =>
  config.app ? `${config.app}${path}` : withBase(`/platform/?next=${encodeURIComponent(path)}`);
export const money = (kopecks: number) => new Intl.NumberFormat('ru-RU').format(kopecks / 100);

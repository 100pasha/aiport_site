export const config = {
  brand: import.meta.env.PUBLIC_BRAND || 'Ligos',
  site: (import.meta.env.PUBLIC_SITE_URL || 'https://ligos.io').replace(/\/$/, ''),
  app: (import.meta.env.PUBLIC_APP_URL || 'https://app.ligos.io').replace(/\/$/, ''),
  email: import.meta.env.PUBLIC_SUPPORT_EMAIL || '',
  ymId: import.meta.env.PUBLIC_YM_ID || '',
  legalName: import.meta.env.PUBLIC_LEGAL_NAME || 'Индивидуальный предприниматель Стоянов Павел Георгиевич',
  inn: import.meta.env.PUBLIC_LEGAL_INN || '771888304488',
  ogrnip: import.meta.env.PUBLIC_LEGAL_OGRNIP || '326774600164773',
  verification: import.meta.env.PUBLIC_YANDEX_VERIFICATION || '',
  // Floating support chat (button + remote widget). Off until PUBLIC_SUPPORT_CHAT=true.
  supportChat: import.meta.env.PUBLIC_SUPPORT_CHAT === 'true',
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

import { withBase } from '../lib/config';
declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    supportChat?: { open: () => void };
  }
}
const body = document.body;
const app = body.dataset.app || '';
const safeStorage = {
  get: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
};
let consent = safeStorage.get('ligos-consent');
function track(goal: string, params: Record<string, unknown> = {}) {
  if (consent === 'all' && window.ym && body.dataset.ymId)
    window.ym(Number(body.dataset.ymId), 'reachGoal', goal, params);
}
function loadAnalytics() {
  const id = body.dataset.ymId;
  if (consent !== 'all' || !id || !/^\d+$/.test(id) || document.querySelector('[data-metrika]'))
    return;
  const queue: unknown[][] = [];
  window.ym = (...args) => {
    queue.push(args);
  };
  Object.assign(window.ym, { a: queue, l: Date.now() });
  const script = document.createElement('script');
  script.dataset.metrika = 'true';
  script.async = true;
  script.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.append(script);
  window.ym(Number(id), 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}
const banner = document.querySelector<HTMLElement>('[data-cookie-banner]');
if (!consent && banner) banner.hidden = false;
document.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((button) =>
  button.addEventListener('click', () => {
    consent = button.dataset.consent || 'necessary';
    safeStorage.set('ligos-consent', consent);
    if (banner) banner.hidden = true;
    loadAnalytics();
  }),
);
loadAnalytics();
function hasCookie(name: string) {
  return document.cookie.split(';').some((v) => v.trim().startsWith(name + '='));
}
function cookie(name: string, value: string, days: number) {
  let domain = '';
  try {
    const host = new URL(body.dataset.site || '').hostname;
    if (location.hostname === host || location.hostname.endsWith('.' + host))
      domain = `; Domain=.${host}`;
  } catch {}
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86400}; Path=/; SameSite=Lax${domain}${location.protocol === 'https:' ? '; Secure' : ''}`;
}
const params = new URLSearchParams(location.search);
const ref = params.get('ref');
if (ref && /^[\w-]{1,100}$/.test(ref)) cookie('ref', ref, 60);
if (!hasCookie('utm')) {
  const utm: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((k) => {
    const v = params.get(k);
    if (v) utm[k] = v.slice(0, 256);
  });
  if (Object.keys(utm).length) cookie('utm', JSON.stringify(utm), 30);
}
document
  .querySelectorAll<HTMLElement>('[data-cta]')
  .forEach((a) =>
    a.addEventListener('click', () =>
      track('cta_click', { block: a.dataset.cta, plan: a.dataset.plan || 'month' }),
    ),
  );
const menu = document.querySelector<HTMLButtonElement>('.menu-toggle');
const mobileMenu = document.querySelector<HTMLElement>('#mobile-menu');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  if (mobileMenu) mobileMenu.hidden = !open;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu && mobileMenu) {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
    mobileMenu.hidden = true;
  }
});
document.querySelectorAll<HTMLElement>('[data-pricing]').forEach((card) => {
  card.querySelectorAll<HTMLButtonElement>('[data-billing]').forEach((button) =>
    button.addEventListener('click', () => {
      const year = button.dataset.billing === 'year';
      card.querySelectorAll<HTMLButtonElement>('[data-billing]').forEach((b) => {
        const active = b === button;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      card.querySelector('[data-price]')!.textContent = year
        ? card.dataset.year!
        : card.dataset.month!;
      card.querySelector('[data-period]')!.textContent = year ? '/ год' : '/ месяц';
      card.querySelector('[data-price-detail]')!.textContent = year
        ? 'Оплата за год · фиксированная цена на 12 месяцев'
        : 'Чтение данных из всех подключённых сервисов';
      const cta = card.querySelector<HTMLAnchorElement>('[data-cta]')!;
      const path = `/signup?plan=${year ? 'year' : 'month'}`;
      cta.href = app ? app + path : withBase('/platform/?next=' + encodeURIComponent(path));
      cta.dataset.plan = year ? 'year' : 'month';
    }),
  );
});
const search = document.querySelector<HTMLInputElement>('[data-catalog-search]');
if (search) {
  const segment = document.querySelector<HTMLSelectElement>('[data-segment]')!;
  const status = document.querySelector<HTMLSelectElement>('[data-filter-status]')!;
  const cats = document.querySelectorAll<HTMLButtonElement>('[data-cat]');
  const cards = document.querySelectorAll<HTMLElement>('[data-service-card]');
  let category = params.get('cat') || '';
  if (![...cats].some((c) => c.dataset.cat === category)) category = '';
  search.value = params.get('q') || '';
  segment.value = params.get('segment') || '';
  status.value = params.get('status') || '';
  function update(write = true) {
    let count = 0;
    const q = search!.value.toLocaleLowerCase('ru').trim();
    cards.forEach((card) => {
      const visible =
        (!q || card.dataset.name!.includes(q)) &&
        (!category || card.dataset.category === category) &&
        (!segment.value || card.dataset.segments!.split(' ').includes(segment.value)) &&
        (!status.value || card.dataset.status === status.value);
      card.hidden = !visible;
      if (visible) count++;
    });
    cats.forEach((c) => {
      c.classList.toggle('active', c.dataset.cat === category);
      c.setAttribute('aria-pressed', String(c.dataset.cat === category));
    });
    document.querySelector('[data-result-count]')!.textContent = String(count);
    document.querySelector<HTMLElement>('[data-empty]')!.hidden = count !== 0;
    if (write) {
      const url = new URL(location.href);
      for (const [key, value] of Object.entries({
        q: search!.value.trim(),
        cat: category,
        segment: segment.value,
        status: status.value,
      })) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      history.replaceState(null, '', url);
    }
  }
  search.addEventListener('input', () => update());
  segment.addEventListener('change', () => update());
  status.addEventListener('change', () => update());
  cats.forEach((c) =>
    c.addEventListener('click', () => {
      category = c.dataset.cat || '';
      update();
    }),
  );
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    search.value = '';
    category = '';
    segment.value = '';
    status.value = '';
    update();
  });
  update(false);
}
const voteDialog = document.querySelector<HTMLDialogElement>('#vote-dialog')!;
const voteForm = document.querySelector<HTMLFormElement>('#vote-form')!;
document.querySelectorAll<HTMLElement>('[data-vote]').forEach((button) =>
  button.addEventListener('click', () => {
    voteForm.reset();
    const id = button.dataset.vote || 'custom';
    (voteForm.elements.namedItem('service_id') as HTMLInputElement).value = id;
    const custom = id === 'custom';
    voteForm.querySelector<HTMLElement>('[data-personal-choice]')!.hidden = id !== 'personal';
    const customLabel = voteForm.querySelector<HTMLElement>('.custom-service-label')!;
    customLabel.hidden = !custom;
    const name = voteForm.elements.namedItem('service_name') as HTMLInputElement;
    name.required = custom;
    voteDialog.querySelector('[data-vote-name]')!.textContent =
      button.dataset.serviceName || 'выбранный вами сервис';
    const message = voteForm.querySelector<HTMLElement>('.form-message')!;
    message.textContent = '';
    message.className = 'form-message';
    voteForm.querySelector<HTMLButtonElement>('[type=submit]')!.disabled = false;
    voteDialog.showModal();
  }),
);
voteForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!voteForm.reportValidity()) return;
  const message = voteForm.querySelector<HTMLElement>('.form-message')!;
  if (!app) {
    message.className = 'form-message error';
    message.textContent =
      'Платформа ещё не запущена. Email не отправлен и не сохранён. Пожалуйста, вернитесь после запуска.';
    return;
  }
  const submit = voteForm.querySelector<HTMLButtonElement>('[type=submit]')!;
  submit.disabled = true;
  message.textContent = 'Отправляем…';
  message.className = 'form-message';
  const data = new FormData(voteForm);
  let id = String(data.get('service_id'));
  if (id === 'custom') id = 'custom:' + String(data.get('service_name')).trim();
  if (id === 'personal') id = String(data.get('personal_service'));
  try {
    const response = await fetch(app + '/api/public/votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service_id: id, email: String(data.get('email')).trim() }),
      signal: AbortSignal.timeout(12000),
    });
    if (response.status !== 200 && response.status !== 201)
      throw new Error(
        response.status === 429
          ? 'Слишком много запросов. Подождите минуту и попробуйте ещё раз.'
          : 'Не удалось отправить заявку. Попробуйте позже.',
      );
    message.className = 'form-message success';
    message.textContent = 'Спасибо! Сообщим, когда подключим.';
    track('vote_service', { service_id: id });
  } catch (error) {
    message.className = 'form-message error';
    message.textContent =
      error instanceof Error && error.name === 'Error'
        ? error.message
        : 'Нет ответа от сервера. Проверьте соединение и попробуйте ещё раз.';
    submit.disabled = false;
  }
});
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        dialog.close();
    }
  });
});
let widgetLoaded = false;
function loadWidget() {
  if (!app || widgetLoaded || document.body.dataset.supportChat !== 'true') return;
  widgetLoaded = true;
  const s = document.createElement('script');
  s.src = app + '/widget/chat.js';
  s.dataset.source = 'site';
  s.defer = true;
  s.addEventListener('load', () => {
    if (window.supportChat) {
      const fallback = document.querySelector<HTMLElement>('.support-fab');
      if (fallback) fallback.hidden = true;
    }
  });
  document.body.append(s);
}
setTimeout(loadWidget, 3000);
['pointerdown', 'keydown'].forEach((name) => addEventListener(name, loadWidget, { once: true }));
document.querySelectorAll('[data-support]').forEach((button) =>
  button.addEventListener('click', () => {
    if (window.supportChat) {
      window.supportChat.open();
    } else {
      document.querySelector<HTMLDialogElement>('#support-dialog')!.showModal();
    }
    track('chat_open');
  }),
);
export {};

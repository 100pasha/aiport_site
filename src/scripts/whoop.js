const dialog = document.getElementById('screenshot-dialog');
document.querySelector('.zoom-button').addEventListener('click', () => {
  if (!dialog.querySelector('img')) {
    const img = document.querySelector('.shot-wrap img').cloneNode();
    img.removeAttribute('loading');
    dialog.querySelector('.zoom-body').append(img);
  }
  dialog.showModal();
});
document.querySelector('.zoom-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
const params = new URLSearchParams(location.search);
const variant = params.get('variant') === 'ads' ? 'ads' : 'letter';
if (variant === 'ads') {
  document.getElementById('page-heading').textContent = 'WHOOP в вашем ChatGPT — Ligos';
  document.getElementById('ads-intro').hidden = false;
  const cta = document.querySelector('[data-cta-group="whoop_letter_mid"]').cloneNode(true);
  cta.dataset.ctaGroup = 'whoop_ads_top';
  cta.querySelector('[data-cta]').dataset.cta = 'whoop_ads_top';
  document.getElementById('ads-cta').append(cta);
}
function track(goal, values) {
  const id = document.body.dataset.ymId;
  if (window.ym && id && /^\d+$/.test(id)) window.ym(Number(id), 'reachGoal', goal, values);
  document.dispatchEvent(new CustomEvent('ligos:goal', { detail: { goal, ...values } }));
}
for (const cta of document.querySelectorAll('[data-cta]')) {
  const dest = new URL(cta.href);
  for (const name of [
    'ref',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
  ]) {
    const value = params.get(name);
    if (value) dest.searchParams.set(name, value.slice(0, 256));
  }
  cta.href = dest.href;
  cta.dataset.variant = variant;
}
const copyStatus = document.getElementById('copy-status'),
  manual = document.getElementById('manual-prompt');
async function copyPrompt(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const active = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
    document.body.append(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {}
    field.remove();
    if (active instanceof HTMLElement) active.focus();
    return copied;
  }
}
for (const button of document.querySelectorAll('[data-prompt]'))
  button.addEventListener('click', async () => {
    const text = button.dataset.prompt;
    const copied = await copyPrompt(text);
    manual.hidden = copied;
    copyStatus.textContent = copied
      ? 'Вопрос скопирован — вставьте его в чат с ИИ.'
      : 'Автоматическое копирование недоступно. Выделите и скопируйте вопрос ниже.';
    if (!copied) {
      manual.value = text;
      manual.focus();
      manual.select();
    } else
      track('prompt_copy', {
        prompt: [...document.querySelectorAll('[data-prompt]')].indexOf(button) + 1,
        variant,
      });
  });

export {};

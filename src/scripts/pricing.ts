import { appLink } from '../lib/config';
document.querySelectorAll<HTMLElement>('[data-approved-pricing]').forEach(root => {
 root.querySelectorAll<HTMLButtonElement>('[data-billing]').forEach(button => button.addEventListener('click', () => {
  const year=button.dataset.billing==='year';
  root.querySelectorAll('[data-billing]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  root.querySelectorAll('[data-billing]').forEach(b=>b.classList.toggle('active',b===button));
  root.querySelector('[data-read-price]')!.textContent=year?'4 000':'490';
  root.querySelector('[data-write-price]')!.textContent=year?'7 500':'890';
  root.querySelectorAll('[data-period]').forEach(e=>e.textContent=year?'/ год':'/ месяц');
  const link=root.querySelector<HTMLAnchorElement>('[data-plan-link]')!;link.href=appLink('/signup?plan='+(year?'year':'month'));
 }));
});
const toast = document.querySelector<HTMLElement>('.toast');
let toastTimer: ReturnType<typeof setTimeout>;

function notify(message: string) {
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3500);
}

async function copyPrompt(prompt: string) {
  try {
    await navigator.clipboard.writeText(prompt);
    return true;
  } catch {
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = prompt;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    try {
      return document.execCommand('copy');
    } finally {
      field.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    }
  }
}

document.querySelectorAll<HTMLButtonElement>('[data-prompt]').forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      const copied = await copyPrompt(button.dataset.prompt || '');
      notify(
        copied
          ? 'Вопрос скопирован — вставьте его в чат с ИИ'
          : 'Выделите и скопируйте вопрос вручную',
      );
    } catch {
      notify('Не удалось скопировать. Выделите текст вопроса вручную.');
    }
  });
});

export {};

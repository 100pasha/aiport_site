import local from '../data/catalog.json';
import { readFileSync, existsSync } from 'node:fs';
export type Service = (typeof local.services)[number];
export const catalog: typeof local =
  import.meta.env.PROD && existsSync('.astro/catalog.json')
    ? JSON.parse(readFileSync('.astro/catalog.json', 'utf8'))
    : local;
export const clients = [
  {
    id: 'claude',
    name: 'Claude',
    symbol: '✳',
    color: '#b86444',
    description: 'Спокойный аналитик для вдумчивых вопросов',
    auth: 'OAuth',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    symbol: '◎',
    color: '#20836d',
    description: 'Привычный помощник, теперь с вашими данными',
    auth: 'OAuth',
  },
  {
    id: 'le-chat',
    name: 'Le Chat',
    symbol: 'M',
    color: '#c16b17',
    description: 'ИИ от Mistral для повседневных задач',
    auth: 'OAuth',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    symbol: 'C',
    color: '#252a30',
    description: 'Данные бизнеса прямо в редакторе',
    auth: 'Персональный ключ',
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    symbol: '>_',
    color: '#b86444',
    description: 'Работайте с данными из терминала',
    auth: 'OAuth',
  },
  {
    id: 'lm-studio',
    name: 'LM Studio',
    symbol: 'LM',
    color: '#7160a2',
    description: 'Подключите свою локальную модель',
    auth: 'Персональный ключ',
  },
  {
    id: 'n8n',
    name: 'n8n',
    symbol: 'n8n',
    color: '#bd456c',
    description: 'Добавьте живые данные в автоматизации',
    auth: 'Персональный ключ',
  },
  {
    id: 'yandex-ai-studio',
    name: 'Yandex AI Studio',
    symbol: 'Я',
    color: '#bf3434',
    description: 'Соберите своего ИИ-агента',
    auth: 'Персональный ключ',
  },
];

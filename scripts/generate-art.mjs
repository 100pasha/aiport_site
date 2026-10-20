import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
await mkdir('public/img/blog', { recursive: true });
const svg = (body, bg = '#ecefe3') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760"><rect width="1200" height="760" fill="${bg}"/><g font-family="DejaVu Sans,Arial,sans-serif">${body}</g></svg>`;
const finance = svg(
  `<circle cx="1040" cy="130" r="240" fill="#e1e7d7"/><rect x="180" y="120" width="840" height="520" rx="30" fill="#fbfaf7"/><text x="240" y="205" font-size="25" fill="#69716b">ЗА ЦИФРАМИ — ВАШ БИЗНЕС</text><text x="240" y="320" font-size="68" font-weight="600" fill="#242b28">Выручка ≠ прибыль</text><path d="M240 510H950" stroke="#dedfd4" stroke-width="2"/>${[110, 170, 145, 210, 180, 250, 295, 260].map((h, i) => `<rect x="${255 + i * 85}" y="${510 - h}" width="48" height="${h}" rx="7" fill="${i === 7 ? '#c94c2e' : '#c4d3b7'}"/>`).join('')}<text x="240" y="578" font-size="22" fill="#69716b">Комиссии · реклама · логистика · возвраты</text>`,
);
const morning = svg(
  `<circle cx="1080" cy="580" r="330" fill="#f0d8c3"/><rect x="180" y="120" width="840" height="520" rx="30" fill="#fbfaf7"/><text x="240" y="205" font-size="25" fill="#9f6246">ХОРОШЕЕ УТРО НАЧИНАЕТСЯ С ЯСНОСТИ</text><text x="240" y="320" font-size="67" font-weight="600" fill="#242b28">Как дела у бизнеса?</text><circle cx="305" cy="455" r="63" fill="#f8eae2"/><text x="305" y="479" text-anchor="middle" font-size="68" fill="#c94c2e">✳</text><rect x="410" y="407" width="490" height="25" rx="12" fill="#d8dfce"/><rect x="410" y="453" width="400" height="22" rx="11" fill="#e7e9e0"/><rect x="410" y="497" width="440" height="22" rx="11" fill="#e7e9e0"/><text x="240" y="582" font-size="22" fill="#69716b">Один вопрос. Три важных показателя. Ваше решение.</text>`,
  '#f3e8dc',
);
const security = svg(
  `<circle cx="110" cy="100" r="280" fill="#dde6d5"/><rect x="180" y="120" width="840" height="520" rx="30" fill="#fbfaf7"/><text x="240" y="205" font-size="25" fill="#526c45">ВАШИ ДАННЫЕ. ВАШИ ПРАВИЛА.</text><text x="240" y="320" font-size="64" font-weight="600" fill="#242b28">Читать. Не изменять.</text><path d="m340 375-65 24v53c0 45 65 83 65 83s65-38 65-83v-53l-65-24Z" fill="#e3ebdc" stroke="#6d8c60" stroke-width="3"/><path d="m309 448 20 20 42-45" fill="none" stroke="#38674d" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><text x="460" y="437" font-size="27" fill="#242b28">Ключ только на чтение</text><text x="460" y="490" font-size="22" fill="#69716b">Минимум прав. Максимум контроля.</text><text x="240" y="582" font-size="22" fill="#69716b">Отдельный доступ, который можно отозвать.</text>`,
);
for (const [name, source] of Object.entries({ finance, morning, security }))
  await sharp(Buffer.from(source))
    .resize(900)
    .webp({ quality: 85 })
    .toFile(`public/img/blog/${name}.webp`);
const mark = await readFile('public/logo-mark.svg', 'utf8');
await writeFile('public/favicon.svg', mark);
const markBody = mark.replace(/^.*?<svg[^>]*>/s, '').replace(/<\/svg>\s*$/, '');
const og = svg(
  `<g transform="translate(100 96)">${markBody}</g><text x="182" y="147" font-size="50" font-weight="700" fill="#242b28">Ligos</text><text x="100" y="310" font-size="74" font-weight="600" fill="#242b28">Спросите свой ИИ,</text><text x="100" y="405" font-size="74" font-weight="600" fill="#242b28">как дела в бизнесе.</text><text x="100" y="510" font-size="27" fill="#69716b">Все ваши кабинеты — в одном разговоре.</text><rect x="100" y="565" width="340" height="65" rx="12" fill="#c94c2e"/><text x="270" y="606" text-anchor="middle" font-size="23" fill="white">7 дней бесплатно →</text>`,
  '#fbfaf7',
);
await sharp(Buffer.from(og)).resize(1200, 630, { fit: 'fill' }).png().toFile('public/img/og.png');

await sharp(Buffer.from(mark)).resize(180).png().toFile('public/apple-touch-icon.png');
const favicon = await sharp(Buffer.from(mark)).resize(32).png().toBuffer();
await writeFile('public/favicon-32.png', favicon);
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(32, 6);
icoHeader.writeUInt8(32, 7);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(favicon.length, 14);
icoHeader.writeUInt32LE(22, 18);
await writeFile('public/favicon.ico', Buffer.concat([icoHeader, favicon]));

await mkdir('public/brand', { recursive: true });
for (const size of [4096, 1024, 512, 256, 128, 64, 32, 16]) {
  await sharp(Buffer.from(mark), { density: size > 1024 ? 288 : 72 })
    .resize(size)
    .png()
    .toFile(`public/brand/ligos-icon-${size}.png`);
}

await writeFile('public/brand/ligos-icon.svg', mark);

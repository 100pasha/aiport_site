import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { validateCatalog } from '../scripts/validate-catalog.mjs';
const local = JSON.parse(
  await readFile(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
);
test('local catalog conforms to the shared contract', () =>
  assert.equal(validateCatalog(local), true));
test('rejects duplicate IDs, invalid pricing, unknown categories and path traversal', () => {
  for (const mutate of [
    (c) => c.services.push(c.services[0]),
    (c) => (c.pricing.month = -1),
    (c) => (c.services[0].category = 'unknown'),
    (c) => (c.services[0].id = '../escape'),
    (c) => (c.services[0].segments = ['invalid']),
    (c) => (c.services[0].votes = -1),
    (c) => (c.services[0].status = 'invented'),
  ]) {
    const candidate = structuredClone(local);
    mutate(candidate);
    assert.throws(() => validateCatalog(candidate));
  }
});
async function runSync(app) {
  const cwd = await mkdtemp(join(tmpdir(), 'aiport-catalog-'));
  try {
    await mkdir(join(cwd, 'src/data'), { recursive: true });
    await writeFile(join(cwd, 'src/data/catalog.json'), JSON.stringify(local));
    const result = await new Promise((res, rej) => {
      const p = spawn(process.execPath, [resolve('scripts/sync-catalog.mjs')], {
        cwd,
        env: { ...process.env, PUBLIC_APP_URL: app },
      });
      let output = '';
      p.stdout.on('data', (v) => (output += v));
      p.stderr.on('data', (v) => (output += v));
      p.on('error', rej);
      p.on('close', (code) => res({ code, output }));
    });
    assert.equal(result.code, 0, result.output);
    return JSON.parse(await readFile(join(cwd, '.astro/catalog.json'), 'utf8'));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
}
test('sync uses API content and falls back for invalid content or HTTP errors', async () => {
  let mode = 'valid';
  const server = createServer((_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (mode === 'fail') {
      res.writeHead(503);
      res.end('{}');
    } else
      res.end(
        JSON.stringify(mode === 'valid' ? { ...local, version: 'api-test' } : { invalid: true }),
      );
  });
  await new Promise((res) => server.listen(0, '127.0.0.1', res));
  const app = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await runSync(app)).version, 'api-test');
    mode = 'invalid';
    assert.deepEqual(await runSync(app), local);
    mode = 'fail';
    assert.deepEqual(await runSync(app), local);
  } finally {
    await new Promise((res) => server.close(res));
  }
});

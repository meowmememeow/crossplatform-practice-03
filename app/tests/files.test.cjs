const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { childPath, listDirectory, regularFile } = require('../files.cjs');

test('каталог читается с каталогами в начале и без изменения имён', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'study-explorer-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'Учёба'));
  await fs.writeFile(path.join(root, 'текст.txt'), 'Привет');
  const result = await listDirectory(root);
  assert.deepEqual(result.items.map(x => [x.name, x.isDir]), [['Учёба', true], ['текст.txt', false]]);
  assert.equal(await regularFile(root, 'текст.txt'), path.join(root, 'текст.txt'));
  await assert.rejects(regularFile(root, 'Учёба'));
  await assert.rejects(regularFile(root, 'missing.txt'));
});
test('имя из IPC не позволяет передать другой путь', () => {
  for (const name of ['..', '../secret', 'a/b', 'a\\b', '', '\0']) assert.throws(() => childPath('/tmp', name));
});
test('внешнее открытие не запускает сценарии и символические ссылки', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'study-explorer-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'run.sh'), 'echo demo');
  await assert.rejects(regularFile(root, 'run.sh'));
  if (process.platform !== 'win32') {
    await fs.symlink(path.join(root, 'run.sh'), path.join(root, 'link.txt'));
    await assert.rejects(regularFile(root, 'link.txt'));
  }
});

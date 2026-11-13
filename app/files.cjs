const fs = require('node:fs/promises');
const path = require('node:path');

// имя приходит из списка каталога, а не из произвольного пути интерфейса
function childPath(directory, name) {
  if (typeof name !== 'string' || !name || name === '.' || name === '..' || /[\\/\0]/u.test(name)) {
    throw new Error('Выберите элемент из списка.');
  }
  return path.join(directory, name);
}

async function listDirectory(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const items = await Promise.all(entries.map(async entry => {
    const item = { name: entry.name, isDir: entry.isDirectory(), isLink: entry.isSymbolicLink(), size: null, modified: null };
    try {
      const stat = await fs.lstat(path.join(directory, entry.name));
      item.size = stat.size;
      item.modified = stat.mtime.toISOString();
    } catch { /* файл мог исчезнуть между readdir и lstat */ }
    return item;
  }));
  items.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name, 'ru', { numeric: true }));
  return { directory, parent: path.dirname(directory), items };
}

async function regularFile(directory, name) {
  const fullPath = childPath(directory, name);
  const stat = await fs.lstat(fullPath);
  if (!stat.isFile()) throw new Error('Открыть можно обычный файл. Для каталога используйте вход в каталог.');
  const extension = path.extname(name).toLowerCase();
  if (['.exe', '.msi', '.bat', '.cmd', '.ps1', '.sh', '.command', '.lnk', '.url', '.desktop', '.jar', '.scr'].includes(extension)) {
    throw new Error('Учебный просмотрщик открывает документы, но не запускает программы и сценарии.');
  }
  return fullPath;
}

module.exports = { childPath, listDirectory, regularFile };

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { childPath, listDirectory, regularFile } = require('./files.cjs');
const profile = require('./profile.json');

let win;
let directory;
const pageURL = pathToFileURL(path.join(__dirname, 'index.html')).href;

function register(channel, action) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (event.sender !== win.webContents || event.senderFrame !== win.webContents.mainFrame || event.senderFrame.url !== pageURL) {
      return { ok: false, error: 'Запрос отклонён.' };
    }
    try { return { ok: true, value: await action(...args) }; }
    catch (error) {
      const messages = { EACCES: 'Нет прав на чтение каталога.', EPERM: 'Операция запрещена системой.', ENOENT: 'Файл или каталог уже не существует.', ENOTDIR: 'Выбранный элемент не является каталогом.' };
      return { ok: false, error: messages[error.code] || error.message };
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    width: 1140, height: 780, minWidth: 720, minHeight: 540,
    title: 'Study Explorer', backgroundColor: '#f3f5f1',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  directory = app.isPackaged ? app.getPath('documents') : app.getAppPath();
  register('profile', () => ({ ...profile, versions: process.versions, platform: process.platform }));
  register('list-dir', () => listDirectory(directory));
  register('choose-dir', async () => {
    const result = await dialog.showOpenDialog(win, { title: 'Выберите каталог', defaultPath: app.getPath('documents'), properties: ['openDirectory'] });
    if (result.canceled) return null;
    const next = await fs.realpath(result.filePaths[0]);
    const listing = await listDirectory(next);
    directory = next;
    return listing;
  });
  register('enter-dir', async name => {
    const next = childPath(directory, name);
    const stat = await fs.lstat(next);
    if (!stat.isDirectory()) throw new Error('Это не обычный каталог. Символические ссылки не раскрываются.');
    const listing = await listDirectory(next);
    directory = next;
    return listing;
  });
  register('parent-dir', async () => {
    const next = path.dirname(directory);
    const listing = await listDirectory(next);
    directory = next;
    return listing;
  });
  register('open-file', async name => {
    const target = await regularFile(directory, name);
    const error = await shell.openPath(target);
    if (error) throw new Error(error);
    return name;
  });
  createWindow();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' }] : []),
    { label: 'Файл', submenu: [{ label: 'Обновить список', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.send('refresh-list') }, { type: 'separator' }, { role: 'quit', label: 'Выйти' }] },
    { label: 'Вид', submenu: [{ role: 'toggleDevTools', label: 'Инструменты разработчика' }, { role: 'resetZoom', label: 'Масштаб 100%' }] }
  ]));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

const $ = id => document.getElementById(id);
let selected = null;
let listing = null;
let busy = false;

function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function size(bytes) { return bytes === null ? '—' : bytes < 1024 ? `${bytes} Б` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} КБ` : `${(bytes / 1048576).toFixed(1)} МБ`; }
function render(data) {
  listing = data; selected = null; $('open').disabled = true;
  $('path').textContent = data.directory; $('parent').disabled = data.parent === data.directory;
  $('count').textContent = `· ${data.items.length}`; $('files').replaceChildren(); $('empty').hidden = data.items.length !== 0;
  for (const item of data.items) {
    const row = document.createElement('tr');
    if (item.isDir) row.classList.add('directory');
    const first = document.createElement('td');
    const button = document.createElement('button'); button.className = 'file-name'; button.type = 'button';
    const icon = document.createElement('span'); icon.className = 'file-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = item.isDir ? '▰' : '▤';
    const name = document.createElement('span'); name.textContent = item.name;
    button.append(icon, name); first.append(button); row.append(first);
    for (const value of [item.isLink ? 'Ссылка' : item.isDir ? 'Каталог' : 'Файл', item.isDir ? '—' : size(item.size), item.modified ? new Date(item.modified).toLocaleDateString('ru-RU') : '—']) {
      const cell = document.createElement('td'); cell.textContent = value; row.append(cell);
    }
    button.addEventListener('click', () => {
      selected = item; document.querySelectorAll('tr.selected').forEach(el => el.classList.remove('selected')); row.classList.add('selected'); $('open').disabled = busy;
      $('open').textContent = item.isDir ? 'Войти в каталог' : 'Открыть выбранное';
    });
    button.addEventListener('dblclick', () => activate(item));
    button.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); activate(item); } });
    $('files').append(row);
  }
  status(`Показано элементов: ${data.items.length}. Двойной щелчок или Enter открывает выбранный элемент.`);
}
async function run(operation, onSuccess = render) {
  if (busy) return;
  busy = true; document.querySelectorAll('.toolbar button').forEach(el => { el.disabled = true; }); $('open').disabled = true;
  try {
    const reply = await operation();
    if (!reply.ok) throw new Error(reply.error);
    if (reply.value !== null) onSuccess(reply.value);
  } catch (error) { status(error.message, true); }
  finally {
    busy = false; document.querySelectorAll('.toolbar button').forEach(el => { el.disabled = false; });
    $('parent').disabled = listing && listing.parent === listing.directory; $('open').disabled = !selected;
  }
}
function activate(item) {
  if (item.isDir) run(() => window.api.enterDir(item.name));
  else run(() => window.api.openFile(item.name), name => status(`Файл «${name}» передан внешней программе.`));
}
$('choose').addEventListener('click', () => run(() => window.api.chooseDir()));
$('refresh').addEventListener('click', () => run(() => window.api.listDir()));
$('parent').addEventListener('click', () => run(() => window.api.parentDir()));
$('open').addEventListener('click', () => { if (selected) activate(selected); });
window.api.onRefresh(() => run(() => window.api.listDir()));
window.api.profile().then(reply => {
  if (!reply.ok) return;
  const p = reply.value; $('student').textContent = p.name; $('group').textContent = p.group;
  $('versions').textContent = `Electron ${p.versions.electron} · Chromium ${p.versions.chrome} · Node ${p.versions.node}`;
});
run(() => window.api.listDir());

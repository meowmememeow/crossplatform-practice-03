const { contextBridge, ipcRenderer } = require('electron');

// наружу передаются отдельные операции, а не ipcRenderer целиком
contextBridge.exposeInMainWorld('api', {
  profile: () => ipcRenderer.invoke('profile'),
  listDir: () => ipcRenderer.invoke('list-dir'),
  chooseDir: () => ipcRenderer.invoke('choose-dir'),
  enterDir: name => ipcRenderer.invoke('enter-dir', name),
  parentDir: () => ipcRenderer.invoke('parent-dir'),
  openFile: name => ipcRenderer.invoke('open-file', name),
  onRefresh: callback => {
    const listener = () => callback();
    ipcRenderer.on('refresh-list', listener);
    return () => ipcRenderer.removeListener('refresh-list', listener);
  }
});

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('codestrike', {
  platform: process.platform,
  isElectron: true,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },

  getAppData: () => ipcRenderer.invoke('get-app-data'),

  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu-action', (_event, action: string) => callback(action));
  },

  showSaveDialog: (options: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('show-save-dialog', options),

  showOpenDialog: (options: { properties?: string[]; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('show-open-dialog', options),
});

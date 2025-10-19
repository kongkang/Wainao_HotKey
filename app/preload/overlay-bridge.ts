import { contextBridge, ipcRenderer } from 'electron';

type OverlayBridge = {
  showOverlay: (payload: unknown) => Promise<unknown>;
  hideOverlay: () => Promise<void>;
};

const bridge: OverlayBridge = {
  async showOverlay(payload) {
    return ipcRenderer.invoke('overlay:show', payload);
  },
  async hideOverlay() {
    await ipcRenderer.invoke('overlay:hide');
  }
};

contextBridge.exposeInMainWorld('overlay', bridge);

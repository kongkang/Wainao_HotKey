import { contextBridge, ipcRenderer } from 'electron';

const allowedChannels = ['overlay:show', 'overlay:hide', 'shortcuts:list'];

contextBridge.exposeInMainWorld('wainao', {
  invoke(channel, payload) {
    if (!allowedChannels.includes(channel)) {
      throw new Error(`Channel ${channel} not permitted`);
    }
    return ipcRenderer.invoke(channel, payload);
  },
  on(channel, listener) {
    if (!allowedChannels.includes(channel)) {
      throw new Error(`Channel ${channel} not permitted`);
    }
    ipcRenderer.on(channel, (_event, ...args) => listener(...args));
  }
});

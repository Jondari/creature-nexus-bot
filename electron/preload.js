const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('creatureNexus', {
  platform: 'desktop'
});

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rickPrime', {
  getSystemSnapshot: () => ipcRenderer.invoke('rickprime:get-system-snapshot'),
  getWorkspaceSummary: () => ipcRenderer.invoke('rickprime:get-workspace-summary'),
  getDiagnosticsSnapshot: () => ipcRenderer.invoke('rickprime:get-diagnostics-snapshot'),
  getDiscoverySnapshot: () => ipcRenderer.invoke('rickprime:get-discovery-snapshot'),
  refreshDiscoverySnapshot: () => ipcRenderer.invoke('rickprime:refresh-discovery-snapshot'),
  getCompanySnapshot: () => ipcRenderer.invoke('rickprime:get-company-snapshot'),
  getProjects: () => ipcRenderer.invoke('rickprime:get-projects'),
  getResearchSnapshot: () => ipcRenderer.invoke('rickprime:get-research-snapshot'),
  getOllamaStatus: () => ipcRenderer.invoke('rickprime:get-ollama-status'),
  getSettings: () => ipcRenderer.invoke('rickprime:get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('rickprime:save-settings', settings),
  chat: (payload) => ipcRenderer.invoke('rickprime:chat', payload),
  runCommand: (commandId) => ipcRenderer.invoke('rickprime:run-command', commandId),
  openDivision: (divisionId) => ipcRenderer.invoke('rickprime:open-division', divisionId),
  openProject: (projectId) => ipcRenderer.invoke('rickprime:open-project', projectId),
  openResearchProject: (projectId) => ipcRenderer.invoke('rickprime:open-research-project', projectId),
  openDiscoveredEntry: (entryId) => ipcRenderer.invoke('rickprime:open-discovered-entry', entryId),
  launchProject: (projectId) => ipcRenderer.invoke('rickprime:launch-project', projectId),
});

'use strict';

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);
const CHAT_ROLES = new Set(['system', 'user', 'assistant']);

function normalizeOllamaEndpoint(value) {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 256) {
    return null;
  }

  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'http:' || !LOCAL_HOSTS.has(parsed.hostname)) {
      return null;
    }
    if (parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

function normalizeModel(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const model = value.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(model) ? model : null;
}

function normalizeSettings(value, defaults) {
  const raw = value && typeof value === 'object' ? value : {};
  const endpoint = normalizeOllamaEndpoint(raw.ollamaEndpoint) ?? defaults.ollamaEndpoint;
  const selectedModel = normalizeModel(raw.selectedModel) ?? defaults.selectedModel;

  return { ollamaEndpoint: endpoint, selectedModel };
}

function normalizeChatPayload(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const model = normalizeModel(value.model);
  if (!model || !Array.isArray(value.messages) || value.messages.length === 0) {
    return null;
  }

  const messages = value.messages.slice(-16).map((message) => {
    if (!message || typeof message !== 'object' || !CHAT_ROLES.has(message.role)) {
      return null;
    }
    if (typeof message.content !== 'string') {
      return null;
    }

    const content = message.content.trim();
    if (!content || content.length > 8000) {
      return null;
    }
    return { role: message.role, content };
  });

  return messages.some((message) => message === null) ? null : { model, messages };
}

module.exports = {
  normalizeChatPayload,
  normalizeModel,
  normalizeOllamaEndpoint,
  normalizeSettings,
};

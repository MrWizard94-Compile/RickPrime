import { Bot, CornerDownLeft, Cpu, LoaderCircle, Radio, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { cx, formatBytes } from '../lib/format';
import type { ChatMessage, OllamaStatus, RickPrimeSettings } from '../types';

interface NeuralNexusProps {
  ollama: OllamaStatus | null;
  settings: RickPrimeSettings | null;
  onChat(model: string, messages: Array<Pick<ChatMessage, 'role' | 'content'>>): Promise<{ model: string; content: string }>;
  onModelChange(model: string): Promise<void>;
}

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return { id: crypto.randomUUID(), role, content };
}

export function NeuralNexus({ ollama, settings, onChat, onModelChange }: NeuralNexusProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage('assistant', 'Neural Nexus armed. I route only through your loopback Ollama runtime; no cloud endpoint is part of this channel.'),
  ]);
  const [draft, setDraft] = useState('');
  const [selectedModel, setSelectedModel] = useState(settings?.selectedModel ?? 'gemma3:270m');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableModels = useMemo(() => ollama?.models.map((model) => model.name) ?? [], [ollama?.models]);
  const models = useMemo(() => {
    if (availableModels.length) return availableModels;
    return settings?.selectedModel ? [settings.selectedModel] : [];
  }, [availableModels, settings?.selectedModel]);

  useEffect(() => {
    if (settings?.selectedModel) setSelectedModel(settings.selectedModel);
  }, [settings?.selectedModel]);

  useEffect(() => {
    if (!ollama?.online || availableModels.length === 0 || availableModels.includes(selectedModel)) return;
    setSelectedModel(availableModels[0]);
  }, [availableModels, ollama?.online, selectedModel]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || busy || !ollama?.online) return;

    const userMessage = createMessage('user', content);
    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setDraft('');
    setBusy(true);
    setError(null);
    try {
      const response = await onChat(selectedModel, [
        { role: 'system', content: 'You are the local RickPrime workstation assistant. Be concise, precise, security-minded, and never claim external actions were completed unless the user confirms them.' },
        ...conversation.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
      ]);
      setMessages((current) => [...current, createMessage('assistant', response.content)]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The local model did not return a response.');
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  async function changeModel(model: string) {
    setSelectedModel(model);
    try {
      await onModelChange(model);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save the selected local model.');
    }
  }

  return (
    <section className="view neural-view" aria-label="Neural Nexus">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><Sparkles aria-hidden="true" size={13} /> Local cognition // no cloud relay</span>
          <h1>Neural <em>nexus</em></h1>
          <p>Talk to your Docker-hosted Ollama models from the workstation. Messages are sent only to the local loopback endpoint that you configure.</p>
        </div>
        <div className={cx('neural-status', ollama?.online && 'is-online')}>
          <Radio aria-hidden="true" size={16} />
          <div><strong>{ollama?.online ? 'Local link stable' : 'Local link offline'}</strong><span>{ollama?.endpoint ?? 'Scanning endpoint'}</span></div>
        </div>
      </header>

      <div className="neural-layout">
        <article className="panel chat-panel">
          <div className="chat-panel__bar">
            <div className="chat-panel__identity"><span className="chat-avatar"><Bot aria-hidden="true" size={18} /></span><div><strong>RickPrime local operator</strong><small>{ollama?.online ? 'Connected through Ollama /api/chat' : 'Awaiting local runtime'}</small></div></div>
            <label className="model-select">
              <Cpu aria-hidden="true" size={14} />
              <span className="sr-only">Local model</span>
              <select value={selectedModel} onChange={(event) => void changeModel(event.target.value)} disabled={busy}>
                {models.map((model) => <option value={model} key={model}>{model}</option>)}
              </select>
            </label>
          </div>
          <div className="chat-scroll" aria-live="polite">
            {messages.map((message) => (
              <article className={cx('chat-message', `chat-message--${message.role}`)} key={message.id}>
                <span className="chat-message__role">{message.role === 'assistant' ? 'PRIME' : 'DIRECTOR'}</span>
                <p>{message.content}</p>
              </article>
            ))}
            {busy && <article className="chat-message chat-message--assistant chat-message--loading"><LoaderCircle aria-hidden="true" size={16} className="spin" /><p>Local model is composing a response…</p></article>}
          </div>
          <form className="chat-composer" onSubmit={submit}>
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder={ollama?.online ? 'Transmit to local model…' : 'Start Docker Ollama to transmit…'} disabled={!ollama?.online || busy} rows={3} />
            <div className="chat-composer__footer">
              <span><CornerDownLeft aria-hidden="true" size={13} /> Enter to send · Shift+Enter for a new line</span>
              <button className="button button--primary" type="submit" disabled={!draft.trim() || !ollama?.online || busy}><Send aria-hidden="true" size={15} /> Send</button>
            </div>
            {error && <p className="inline-error" role="alert">{error}</p>}
          </form>
        </article>

        <aside className="neural-sidebar">
          <article className="panel model-stack">
            <div className="panel__heading"><div><span className="section-label">Model cartridge rack</span><h2>Local inventory</h2></div><Cpu aria-hidden="true" className="panel__icon" size={18} /></div>
            <div className="model-stack__rows">
              {ollama?.models.map((model) => (
                <button className={cx('model-card', model.name === selectedModel && 'is-selected')} key={model.name} type="button" onClick={() => void changeModel(model.name)}>
                  <span className="model-card__orb" aria-hidden="true" />
                  <span><strong>{model.name}</strong><small>{formatBytes(model.size)} · local</small></span>
                </button>
              ))}
              {!ollama?.models.length && <p className="empty-state">No local models were returned. Start the Docker Ollama stack, then refresh the system core.</p>}
            </div>
          </article>
          <article className="panel neural-guardrail">
            <ShieldCheck aria-hidden="true" size={20} />
            <div><strong>Local-first boundary</strong><p>RickPrime accepts only loopback Ollama endpoints. It does not store API keys or relay prompts to cloud models.</p></div>
          </article>
        </aside>
      </div>
    </section>
  );
}

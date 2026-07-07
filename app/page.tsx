'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatResponse = {
  response: string;
  fallback: boolean;
  model: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    content:
      'Hi, I’m ArenaOne. Ask me for gates, sections, washrooms, food, or medical points inside the stadium.',
  },
];

const suggestedPrompts = [
  'nearest accessible washroom to Gate 4',
  'Where can I get vegetarian food under $10?',
  'How do I reach Medical Point Alpha from Gate 4?',
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready');
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle('simple-mode', accessibilityMode);

    return () => document.body.classList.remove('simple-mode');
  }, [accessibilityMode]);

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  async function sendMessage(nextMessage: string) {
    const trimmedMessage = nextMessage.trim();
    if (!trimmedMessage || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setMessage('');
    setIsLoading(true);
    setStatus('ArenaOne is thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedMessage,
          accessibilityMode,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error ?? 'ArenaOne could not answer right now.');
      }

      const data = (await response.json()) as ChatResponse;

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
        },
      ]);
      setStatus(data.fallback ? 'Fallback answer shown' : `Answered by ${data.model}`);
    } catch (error) {
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : "I'm having trouble connecting to the stadium database. Please follow the signs to the nearest info booth.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: fallbackMessage,
        },
      ]);
      setStatus('Connection issue');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(message);
  }

  return (
    <main className="chat-shell" aria-labelledby="chat-title">
      <section className="chat-hero" aria-describedby="chat-subtitle">
        <div>
          <span className="eyebrow">FIFA World Cup 2026 Stadium Assistant</span>
          <h1 id="chat-title">ArenaOne Fan Help</h1>
          <p id="chat-subtitle">
            Ask for routes, accessible washrooms, food stalls, medical points, gates,
            and seating sections. I only use the stadium graph.
          </p>
        </div>

        <label className="simple-toggle">
          <span>
            <strong>Accessibility Mode</strong>
            <small>Simple words, bigger text, stronger contrast.</small>
          </span>
          <input
            type="checkbox"
            checked={accessibilityMode}
            onChange={(event) => setAccessibilityMode(event.target.checked)}
            aria-label="Toggle accessibility simple mode"
          />
        </label>
      </section>

      <section className="chat-workspace glass-card" aria-label="ArenaOne chat workspace">
        <div className="chat-toolbar">
          <div>
            <strong>Live fan assistant</strong>
            <span aria-live="polite">{status}</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setMessages(initialMessages);
              setStatus('Ready');
              inputRef.current?.focus();
            }}
          >
            Reset chat
          </button>
        </div>

        <div
          ref={logRef}
          className="chat-log"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Conversation messages"
        >
          {messages.map((chatMessage) => (
            <article
              key={chatMessage.id}
              className={`chat-bubble ${chatMessage.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}
              aria-label={chatMessage.role === 'user' ? 'Your message' : 'ArenaOne response'}
            >
              <span>{chatMessage.role === 'user' ? 'You' : 'ArenaOne'}</span>
              <p>{chatMessage.content}</p>
            </article>
          ))}

          {isLoading && (
            <article className="chat-bubble ai-bubble loading-bubble" aria-label="ArenaOne is typing">
              <span>ArenaOne</span>
              <p>Checking the stadium graph…</p>
            </article>
          )}
        </div>

        <div className="prompt-chips" aria-label="Suggested prompts">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendMessage(prompt)}
              disabled={isLoading}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form className="chat-form" onSubmit={handleSubmit}>
          <label htmlFor="fan-message">Ask ArenaOne</label>
          <div>
            <input
              ref={inputRef}
              id="fan-message"
              className="input"
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Example: nearest accessible washroom to Gate 4"
              disabled={isLoading}
              aria-describedby="chat-help"
              autoComplete="off"
            />
            <button className="btn btn-primary" type="submit" disabled={isLoading || !message.trim()}>
              {isLoading ? 'Sending…' : 'Send'}
            </button>
          </div>
          <p id="chat-help">
            Press Enter to send. Use Tab to move through the workspace.
          </p>
        </form>
      </section>
    </main>
  );
}

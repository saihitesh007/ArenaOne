'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { getStadiumZoneById, STADIUM_ZONES } from '@/lib/data/stadium-graph';

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

type RoleView = 'fan' | 'staff';
type StaffPanel = 'incidents' | 'crowd' | 'summary';

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
  'How do I get to the metro after the match?',
  'Which parking exit should I use from Gate 4?',
];

const staffTabs: { id: StaffPanel; label: string }[] = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'crowd', label: 'Crowd Intelligence' },
  { id: 'summary', label: 'Situation Summary' },
];

export default function Home() {
  const [activeView, setActiveView] = useState<RoleView>('fan');
  const [activeStaffPanel, setActiveStaffPanel] = useState<StaffPanel>('incidents');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [message, setMessage] = useState('');
  const [currentZoneId, setCurrentZoneId] = useState('');
  const [checkInStatus, setCheckInStatus] = useState('No zone checked in yet.');
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const currentZone = currentZoneId ? getStadiumZoneById(currentZoneId) : undefined;

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

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedMessage,
          accessibilityMode,
          currentZoneId: currentZone?.id,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error ?? 'ArenaOne could not answer right now.');
      }

      const data = (await response.json()) as ChatResponse;

      if (data.fallback) {
        console.warn('[ArenaOne] Chat fallback response shown to user.');
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.response,
        },
      ]);
    } catch (error) {
      console.warn('[ArenaOne] Chat request failed:', error);

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
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(message);
  }

  function getAnonymousSessionId() {
    const storedSessionId = window.localStorage.getItem('arenaoneAnonymousSessionId');
    if (storedSessionId) return storedSessionId;

    const nextSessionId = `anon_${crypto.randomUUID().replaceAll('-', '').slice(0, 24)}`;
    window.localStorage.setItem('arenaoneAnonymousSessionId', nextSessionId);
    return nextSessionId;
  }

  async function handleZoneCheckIn() {
    const zone = currentZoneId ? getStadiumZoneById(currentZoneId) : undefined;
    if (!zone) {
      setCheckInStatus('Choose a gate or section first.');
      return;
    }

    const sessionId = getAnonymousSessionId();
    setCheckInStatus(`Checking in at ${zone.name}…`);

    try {
      const response = await fetch('/api/crowd-density/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: zone.id,
          anonymousSessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(errorBody?.error ?? 'Check-in could not be saved.');
      }

      setCheckInStatus(`Checked in at ${zone.name}. This is self-reported, not GPS.`);
    } catch (error) {
      console.warn('[ArenaOne] Zone check-in failed:', error);
      setCheckInStatus('Zone saved for chat. Crowd signal could not be uploaded.');
    }
  }

  return (
    <div className="app-shell">
      <header className="top-nav">
        <div className="app-container nav-inner">
          <button
            type="button"
            className="brand-lockup"
            onClick={() => setActiveView('fan')}
            aria-label="Go to ArenaOne Fan Assistant"
          >
            <span className="brand-mark" aria-hidden="true">
              A1
            </span>
            <span>
              <strong>ArenaOne</strong>
              <small>World Cup Stadium OS</small>
            </span>
          </button>

          <nav className="role-tabs" aria-label="Role views">
            <button
              type="button"
              className={activeView === 'fan' ? 'active' : ''}
              onClick={() => setActiveView('fan')}
              aria-current={activeView === 'fan' ? 'page' : undefined}
            >
              Fan Assistant
            </button>
            <button
              type="button"
              className={activeView === 'staff' ? 'active' : ''}
              onClick={() => setActiveView('staff')}
              aria-current={activeView === 'staff' ? 'page' : undefined}
            >
              Staff Dashboard
            </button>
          </nav>
        </div>
      </header>

      <main className="app-container main-content">
        {activeView === 'fan' ? (
          <section className="fan-view" aria-labelledby="fan-title">
            <div className="page-heading">
              <span className="eyebrow">Fan Assistant</span>
              <div>
                <h1 id="fan-title">Find your next stadium step.</h1>
                <p>
                  Ask for routes, accessible washrooms, food stalls, medical points,
                  transport exits, parking, gates, and seating sections. ArenaOne answers only from the stadium graph.
                </p>
              </div>
            </div>

            <section className="assistant-grid">
              <aside className="info-panel" aria-label="Assistant capabilities">
                <div className="mode-card">
                  <div>
                    <h2>Simple Mode</h2>
                    <p>Bigger text, higher contrast, and shorter directions.</p>
                  </div>
                  <label className="switch-control">
                    <span className="sr-only">Toggle accessibility simple mode</span>
                    <input
                      type="checkbox"
                      checked={accessibilityMode}
                      onChange={(event) => setAccessibilityMode(event.target.checked)}
                    />
                    <span aria-hidden="true" />
                  </label>
                </div>

                <div className="zone-card">
                  <div>
                    <h2>Check in your zone</h2>
                    <p>
                      Pick your current gate or section. This is self-reported and anonymous —
                      no GPS, no live tracking.
                    </p>
                  </div>
                  <div className="zone-control">
                    <label htmlFor="current-zone">Current zone</label>
                    <select
                      id="current-zone"
                      value={currentZoneId}
                      onChange={(event) => {
                        setCurrentZoneId(event.target.value);
                        setCheckInStatus(
                          event.target.value
                            ? 'Ready to check in this zone.'
                            : 'No zone checked in yet.'
                        );
                      }}
                    >
                      <option value="">Select a gate or section</option>
                      {STADIUM_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="zone-check-button"
                      onClick={() => void handleZoneCheckIn()}
                      disabled={!currentZoneId}
                    >
                      Check in
                    </button>
                  </div>
                  <p className="zone-status" aria-live="polite">
                    {checkInStatus}
                  </p>
                </div>

                <div className="quick-card">
                  <h2>Try asking</h2>
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
                </div>

                <div className="metrics-card" aria-label="Available stadium graph data">
                  <div>
                    <strong>8</strong>
                    <span>Gates</span>
                  </div>
                  <div>
                    <strong>8</strong>
                    <span>Sections</span>
                  </div>
                  <div>
                    <strong>7</strong>
                    <span>Facilities</span>
                  </div>
                </div>
              </aside>

              <section className="chat-card" aria-label="ArenaOne chat workspace">
                <div className="chat-card-header">
                  <div>
                    <h2>Live Guidance</h2>
                    <p>
                      Multilingual directions, facilities, transport, parking, and food help.
                      {currentZone ? ` Current zone: ${currentZone.name}.` : ''}
                    </p>
                  </div>
                  <span className="subtle-badge" aria-live="polite">
                    {isLoading ? 'Thinking' : 'Ready'}
                  </span>
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
                      className={`message-row ${chatMessage.role === 'user' ? 'message-user' : 'message-ai'}`}
                      aria-label={chatMessage.role === 'user' ? 'Your message' : 'ArenaOne response'}
                    >
                      <div className="message-avatar" aria-hidden="true">
                        {chatMessage.role === 'user' ? 'You' : 'AI'}
                      </div>
                      <div className="chat-bubble">
                        <span>{chatMessage.role === 'user' ? 'You' : 'ArenaOne'}</span>
                        <p>{chatMessage.content}</p>
                      </div>
                    </article>
                  ))}

                  {messages.length <= 1 && !isLoading && (
                    <div className="chat-log-empty" aria-hidden="true">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <p>Ask ArenaOne about gates, food, washrooms, or transport to get started.</p>
                    </div>
                  )}

                  {isLoading && (
                    <article className="message-row message-ai" aria-label="ArenaOne is typing">
                      <div className="message-avatar" aria-hidden="true">
                        AI
                      </div>
                      <div className="chat-bubble loading-bubble">
                        <span>ArenaOne</span>
                        <p>Checking the stadium graph…</p>
                      </div>
                    </article>
                  )}
                </div>

                <form className="chat-form" onSubmit={handleSubmit}>
                  <label htmlFor="fan-message">Ask ArenaOne</label>
                  <div className="composer-row">
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
                    <button
                      className="btn btn-primary"
                      type="submit"
                      disabled={isLoading || !message.trim()}
                    >
                      {isLoading ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  <p id="chat-help">Press Enter to send. Use Tab to navigate every control.</p>
                </form>
              </section>
            </section>
          </section>
        ) : (
          <section className="staff-view" aria-labelledby="staff-title">
            <div className="page-heading">
              <span className="eyebrow">Feature 6</span>
              <div>
                <h1 id="staff-title">Staff Dashboard</h1>
                <p>
                  A single operational shell for incident triage, crowd pressure,
                  and executive summaries during matchday.
                </p>
              </div>
            </div>

            <div className="dashboard-shell">
              <aside className="dashboard-sidebar" aria-label="Staff dashboard sections">
                {staffTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeStaffPanel === tab.id ? 'active' : ''}
                    onClick={() => setActiveStaffPanel(tab.id)}
                    aria-current={activeStaffPanel === tab.id ? 'true' : undefined}
                  >
                    {tab.label}
                  </button>
                ))}
              </aside>

              <section className="dashboard-panel" aria-live="polite">
                {activeStaffPanel === 'incidents' && <IncidentsPanel />}
                {activeStaffPanel === 'crowd' && <CrowdPanel currentZoneName={currentZone?.name} />}
                {activeStaffPanel === 'summary' && <SummaryPanel currentZoneName={currentZone?.name} />}
              </section>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function IncidentsPanel() {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function submitIncident(e: FormEvent) {
    e.preventDefault();
    if (!description) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, reporterRole: 'Volunteer/Staff' })
      });
      if (!res.ok) throw new Error('Submission failed');
      setDescription('');
      setMessage('Incident reported successfully.');
    } catch {
      setMessage('Failed to submit incident.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="panel-header">
        <div>
          <span className="section-kicker">Incidents</span>
          <h2>Active response queue</h2>
        </div>
        <span className="subtle-badge warning">3 open</span>
      </div>

      <div className="report-form-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 'var(--space-2)' }}>Volunteer & Staff Incident Report</h3>
        <form onSubmit={submitIncident} style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <input 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="e.g. kid lost near section D wearing blue jersey" 
            className="input" 
            disabled={isSubmitting}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || !description}>
            {isSubmitting ? 'Sending...' : 'Report'}
          </button>
        </form>
        {message && (
          <p className={`form-feedback ${message.startsWith('Failed') ? 'error' : 'success'}`}>
            {message.startsWith('Failed') ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {message}
          </p>
        )}
      </div>

      <div className="incident-list">
        <article>
          <span className="severity high">High</span>
          <div>
            <h3>Medical assist near Section F</h3>
            <p>Dispatch Medical Point Beta. Keep west concourse lane clear.</p>
          </div>
        </article>
        <article>
          <span className="severity medium">Medium</span>
          <div>
            <h3>Queue buildup at Gate 4</h3>
            <p>Redirect late arrivals toward Gate 3 and open south overflow lane.</p>
          </div>
        </article>
        <article>
          <span className="severity low">Low</span>
          <div>
            <h3>Lost item report at Gate 8</h3>
            <p>Route guest to Information Desk via Concourse Northwest.</p>
          </div>
        </article>
      </div>
    </>
  );
}

function CrowdPanel({ currentZoneName }: { currentZoneName?: string }) {
  const [zoneId, setZoneId] = useState('');
  const [category, setCategory] = useState<'crowd' | 'sustainability' | 'transport'>('crowd');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  async function submitReport(e: FormEvent) {
    e.preventDefault();
    if (!zoneId || !note) return;
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/crowd-density', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, category, note })
      });
      if (!res.ok) throw new Error('Submission failed');
      setNote('');
      setZoneId('');
      setMessage('Report submitted.');
    } catch {
      setMessage('Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="panel-header">
        <div>
          <span className="section-kicker">Crowd Intelligence</span>
          <h2>Pressure by zone</h2>
          <p>Density blends staff reports with anonymous fan zone check-ins.</p>
        </div>
        <span className="subtle-badge">Shared pipeline</span>
      </div>

      <div className="report-form-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 'var(--space-2)' }}>Volunteer & Staff Crowd / Transport Report</h3>
        <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="input" required>
              <option value="">Select zone...</option>
              {STADIUM_ZONES.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <select value={category} onChange={(e) => setCategory(e.target.value as 'crowd' | 'sustainability' | 'transport')} className="input" style={{ maxWidth: '160px' }}>
              <option value="crowd">Crowd</option>
              <option value="transport">Transport</option>
              <option value="sustainability">Sustainability</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Metro Gate 6 overcrowded" className="input" required disabled={isSubmitting} />
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !zoneId || !note}>
              {isSubmitting ? 'Sending...' : 'Report'}
            </button>
          </div>
        </form>
        {message && (
          <p className={`form-feedback ${message.startsWith('Failed') ? 'error' : 'success'}`}>
            {message.startsWith('Failed') ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            {message}
          </p>
        )}
      </div>

      {currentZoneName && (
        <div className="signal-note">
          Latest fan self-reported check-in: <strong>{currentZoneName}</strong>
        </div>
      )}
      <div className="crowd-grid">
        {[
          ['Gate 4', '82%', 'Staff reports + fan check-ins show heavy arrival flow'],
          ['Section C', '64%', 'Blended signal shows stable movement'],
          ['Parking Exit B', '58%', 'Transport reports flag slower post-match vehicle flow'],
          ['Gate 8', '31%', 'Fan check-ins remain light near Parking Exit A'],
        ].map(([zone, value, note]) => (
          <article key={zone}>
            <div>
              <h3>{zone}</h3>
              <span>{note}</span>
            </div>
            <strong>{value}</strong>
            <div className="meter" aria-hidden="true">
              <span style={{ width: value }} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function SummaryPanel({ currentZoneName }: { currentZoneName?: string }) {
  return (
    <>
      <div className="panel-header">
        <div>
          <span className="section-kicker">Situation Summary</span>
          <h2>Matchday command brief</h2>
          <p>AI narrative uses the same blended density and transport signal.</p>
        </div>
        <span className="subtle-badge success">Operational</span>
      </div>
      <div className="summary-layout">
        <article>
          <h3>Current priority</h3>
          <p>
            Reduce Gate 4 congestion using steward reports, anonymous fan check-ins,
            and transport alerts such as Parking Exit B blockage reports.
            {currentZoneName ? ` A recent fan self-check-in is near ${currentZoneName}.` : ''}
          </p>
        </article>
        <article>
          <h3>Recommended action</h3>
          <p>
            Move two stewards to Concourse South, add signage toward Gate 3,
            and route drivers from South Garage toward Parking Exit B only if it remains clear.
          </p>
        </article>
      </div>
    </>
  );
}

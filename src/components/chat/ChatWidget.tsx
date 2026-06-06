import { useState, useRef, useEffect, type ReactNode } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Raccourcis thématiques permanents (les "volets") — toujours visibles au-dessus
// de l'input. Chaque clic envoie la question préparée associée.
const TOPICS: { label: string; q: string }[] = [
  { label: 'Projets', q: 'Quels sont ses projets en IA ?' },
  { label: 'Stack', q: 'Quelle est sa stack technique ?' },
  { label: 'Parcours', q: 'Quel est son parcours ?' },
  { label: 'Dispo', q: 'Est-il disponible ?' },
  { label: 'Contact', q: 'Comment le contacter ?' },
];

// Pool de relances — questions de suivi plus précises, proposées après chaque
// réponse de l'assistant (on retire celles déjà posées).
const FOLLOWUPS: string[] = [
  "Parle-moi d'InfiniDex",
  'Le projet Audiomancy en détail ?',
  'Quels articles a-t-il écrits ?',
  'Son expérience en MLOps ?',
  'Comment il utilise le RAG ?',
  'Quelles bases de données maîtrise-t-il ?',
];

// ── Minimal safe markdown renderer ────────────────────────────────────────────
// Supports: **bold**, [text](url), - bullets, paragraph breaks.
// No HTML injection (returns JSX, never uses dangerouslySetInnerHTML).
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Token order: link [text](url) > bold **xxx**
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[1] && match[2]) {
      const href = match[2];
      const isExternal = /^https?:\/\//.test(href);
      nodes.push(
        <a
          key={key++}
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="underline underline-offset-2 text-brand-600 hover:text-brand-700"
        >
          {match[1]}
        </a>,
      );
    } else if (match[3]) {
      nodes.push(<strong key={key++} className="font-semibold text-foreground">{match[3]}</strong>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderMarkdown(content: string): ReactNode {
  // Split into blocks on blank lines
  const blocks = content.split(/\n\n+/);
  return blocks.map((block, bi) => {
    const lines = block.split('\n');
    // Bullet list if every non-empty line starts with "- " or "* "
    const bulletLines = lines.filter((l) => l.trim().length > 0);
    const isList = bulletLines.length > 0 && bulletLines.every((l) => /^\s*[-*]\s+/.test(l));
    if (isList) {
      return (
        <ul key={bi} className="list-disc pl-4 space-y-1 my-1">
          {bulletLines.map((line, li) => (
            <li key={li}>{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={bi} className={bi === 0 ? '' : 'mt-2'}>
        {lines.map((line, li) => (
          <span key={li}>
            {renderInline(line)}
            {li < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Salut ! Je suis l\'assistant de Benjamin. Pose-moi tes questions sur son profil, ses projets ou sa stack technique. 👋',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput('');

    // Historique = échanges précédents (on retire le message d'accueil [0]).
    const history = messages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Une erreur est survenue.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (data.remaining !== undefined) setRemaining(data.remaining);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setError('Impossible de contacter le serveur.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  // Relances : questions de suivi proposées après chaque réponse de l'assistant,
  // en retirant celles déjà posées.
  const askedSet = new Set(
    messages.filter((m) => m.role === 'user').map((m) => m.content.trim())
  );
  const lastMsg = messages[messages.length - 1];
  const showFollowups = !loading && messages.length > 1 && lastMsg?.role === 'assistant';
  const followupChips = FOLLOWUPS.filter((q) => !askedSet.has(q)).slice(0, 3);

  return (
    <div className="fixed bottom-6 right-20 z-50 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="flex flex-col w-[340px] max-h-[520px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background-secondary">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-foreground">Assistant de Benjamin</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-foreground-muted hover:text-foreground transition-colors text-lg leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 bg-background">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary rounded-xl px-4 py-3">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-foreground-muted rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            {/* Relances après chaque réponse de l'assistant */}
            {showFollowups && followupChips.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-wider text-foreground-subtle">
                  Pour aller plus loin
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {followupChips.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border text-foreground-muted hover:text-brand-600 hover:border-brand-400 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Volets : raccourcis thématiques permanents */}
          <div className="px-4 pt-2 pb-1 flex flex-wrap gap-1.5 border-t border-border bg-background">
            {TOPICS.map((t) => (
              <button
                key={t.label}
                onClick={() => sendMessage(t.q)}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground-secondary hover:text-brand-600 hover:border-brand-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Rate limit indicator */}
          {remaining !== null && remaining <= 3 && (
            <p className="text-xs text-foreground-subtle text-center px-4 bg-background">
              {remaining} message{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
            </p>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-border bg-background">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pose ta question…"
                maxLength={500}
                disabled={loading}
                className="flex-1 bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder-foreground-subtle outline-none focus:ring-1 focus:ring-brand-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20 hover:bg-brand-600 hover:scale-105 transition-all flex items-center justify-center"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {open ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
            <path d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
        )}
      </button>
    </div>
  );
}

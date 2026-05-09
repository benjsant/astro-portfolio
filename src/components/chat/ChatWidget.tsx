import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Quels sont tes projets IA ?',
  'Quelle est ta stack technique ?',
  'Tu es disponible quand ?',
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis l\'assistant de Benjamin. Posez-moi vos questions sur son profil, ses projets ou ses compétences. 👋',
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
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
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

  return (
    <div className="fixed bottom-6 right-20 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col w-[340px] max-h-[520px] rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-white">Assistant de Benjamin</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/80 transition-colors text-lg leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/90'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-xl px-4 py-3">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only on first message) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2.5 py-1 rounded-full border border-white/15 text-white/60 hover:text-white hover:border-white/40 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Rate limit indicator */}
          {remaining !== null && remaining <= 3 && (
            <p className="text-xs text-white/30 text-center px-4">
              {remaining} message{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}
            </p>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10">
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
                placeholder="Posez votre question…"
                maxLength={500}
                disabled={loading}
                className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-white/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
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
        className="w-14 h-14 rounded-full bg-white text-black shadow-lg hover:scale-105 transition-transform flex items-center justify-center text-2xl"
        aria-label={open ? 'Fermer le chat' : 'Ouvrir le chat'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
}

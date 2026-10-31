import { useCallback, useEffect, useRef, useState } from 'react';
import { primeAudio } from '../audio/ambient';
import { useActions, useAudioOn, useClover, useDevice, useEnv } from '../state/hooks';
import { cn } from '../lib/utils';
import { respond, suggestionsFor, TOUR, type Action, type Reply } from './brain';
import { CloverHead, type Mood } from './CloverArt';

interface Message {
  id: number;
  from: 'clover' | 'you';
  lines: string[];
  actions?: Action[];
  /** Show the last line as a declaration. */
  proclaim?: boolean;
}

const GREETED = 'aj:clover-greeted';

/** A small crown that settles in beside a declaration. */
const CrownMark = () => (
  <svg className="clover-crown" width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
    <path d="M1.5 12.5h15M2 10.5 1 3.2l4.6 3.6L9 1.5l3.4 5.3L17 3.2l-1 7.3z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

/** Blinks every few seconds — a class toggle, not an animation loop, and only while the tab is visible. */
function useBlink() {
  const [blinking, setBlinking] = useState(false);
  useEffect(() => {
    let t = 0;
    const schedule = () => {
      t = window.setTimeout(() => {
        if (!document.hidden) {
          setBlinking(true);
          window.setTimeout(() => setBlinking(false), 140);
        }
        schedule();
      }, 2800 + Math.random() * 3600);
    };
    schedule();
    return () => window.clearTimeout(t);
  }, []);
  return blinking;
}

export default function Clover({ ready }: { ready: boolean }) {
  const { open, pending, nonce } = useClover();
  const { openClover, closeClover, goTo, toggleAudio, setTerminalOpen } = useActions();
  const { active } = useEnv();
  const { compact, reducedMotion } = useDevice();
  const audioOn = useAudioOn();

  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState<Mood>('idle');
  const [greeting, setGreeting] = useState(false);
  const [tour, setTour] = useState<number | null>(null);
  const blinking = useBlink();

  const nextId = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* Moods fade back to idle. */
  useEffect(() => {
    if (mood === 'idle') return;
    const t = window.setTimeout(() => setMood('idle'), 4200);
    return () => window.clearTimeout(t);
  }, [mood]);

  /* A one-time hello, a few seconds after arriving. */
  useEffect(() => {
    if (!ready) return;
    try {
      if (window.sessionStorage.getItem(GREETED)) return;
    } catch {
      /* storage blocked — greet anyway */
    }
    const show = window.setTimeout(() => {
      setGreeting(true);
      // Once per session, whether or not it gets an answer.
      try {
        window.sessionStorage.setItem(GREETED, '1');
      } catch {
        /* nothing to remember it in */
      }
    }, 3200);
    const hide = window.setTimeout(() => setGreeting(false), 16000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [ready]);

  const dismissGreeting = useCallback(() => {
    setGreeting(false);
    try {
      window.sessionStorage.setItem(GREETED, '1');
    } catch {
      /* nothing to remember it in */
    }
  }, []);

  const push = useCallback((m: Omit<Message, 'id'>) => {
    setMessages((list) => [...list, { ...m, id: nextId.current++ }]);
  }, []);

  /* ── the tour ── */
  const startTour = useCallback(() => {
    dismissGreeting();
    closeClover();
    setTour(0);
    setMood('happy');
    goTo(TOUR[0].to);
  }, [closeClover, dismissGreeting, goTo]);

  const stepTour = useCallback(
    (dir: 1 | -1) => {
      if (tour === null) return;
      const next = tour + dir;
      if (next < 0 || next >= TOUR.length) return setTour(null);
      setTour(next);
      setMood(dir > 0 ? 'happy' : 'curious');
      goTo(TOUR[next].to);
    },
    [tour, goTo],
  );

  /* ── conversation ── */
  const handleReply = useCallback(
    (reply: Reply) => {
      push({ from: 'clover', lines: reply.lines, actions: reply.actions, proclaim: reply.proclaim });
      setMood(reply.mood);
      if (reply.tour) later(startTour, 700);
      if (reply.go) {
        const to = reply.go;
        later(() => {
          // On a phone the sheet would hide the chapter we just travelled to.
          if (compact) closeClover();
          goTo(to);
        }, 500);
      }
    },
    [push, later, startTour, compact, closeClover, goTo],
  );

  const send = useCallback(
    (text: string) => {
      const clean = text.trim().slice(0, 240);
      if (!clean) return;
      push({ from: 'you', lines: [clean] });
      setTyping(true);
      setMood('thinking');
      const reply = respond(clean, active);
      const delay = reducedMotion ? 120 : Math.min(1100, 380 + reply.lines.join(' ').length * 4);
      later(() => {
        setTyping(false);
        handleReply(reply);
      }, delay);
    },
    [active, push, later, handleReply, reducedMotion],
  );

  const runAction = useCallback(
    (a: Action) => {
      if (a.kind === 'ask') return send(a.text);
      if (a.kind === 'tour') return startTour();
      if (a.kind === 'goto') {
        if (compact) closeClover();
        return goTo(a.to);
      }
      if (a.kind === 'ambient') {
        if (!audioOn) primeAudio();
        toggleAudio();
        push({ from: 'clover', lines: [audioOn ? 'Sound off. Nice and quiet.' : 'Sound on — soft and low. Toggle it any time up top.'] });
        return;
      }
      if (a.kind === 'terminal') {
        closeClover();
        setTerminalOpen(true);
      }
    },
    [send, startTour, compact, closeClover, goTo, audioOn, toggleAudio, push, setTerminalOpen],
  );

  /* Questions asked from elsewhere on the page. */
  const handled = useRef(0);
  useEffect(() => {
    if (!open || !pending || handled.current === nonce) return;
    handled.current = nonce;
    send(pending);
  }, [open, pending, nonce, send]);

  /* Focus and keyboard. */
  useEffect(() => {
    if (!open) return;
    // On a phone, focusing the input would throw the keyboard up immediately.
    if (compact) panelRef.current?.focus();
    else inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeClover();
        launcherRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, compact, closeClover]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open]);

  const suggestions = suggestionsFor(active);
  const step = tour !== null ? TOUR[tour] : null;

  return (
    <div className="clover-root">
      {/* Speech bubble: greeting or tour narration. */}
      {!open && ((greeting && messages.length === 0) || step) && (
        <div
          className="surface fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] z-50 w-[min(320px,calc(100vw-2rem))] p-4 sm:right-6 sm:bottom-[6.5rem]"
          style={{ animation: 'pop-in 420ms var(--ease-out-expo) both', background: 'color-mix(in oklab, #0b0f1f 94%, transparent)', borderColor: 'color-mix(in oklab, #ff9b52 35%, transparent)' }}
          role="status"
          aria-live="polite"
        >
          <span aria-hidden="true" className="absolute right-8 -bottom-[7px] h-3 w-3 rotate-45 border-r border-b bg-[#0b0f1f]" style={{ borderColor: 'color-mix(in oklab, #ff9b52 35%, transparent)' }} />
          {step ? (
            <>
              <p className="label mb-2 text-[#ffb27a]">
                Tour · {String((tour ?? 0) + 1).padStart(2, '0')} / {String(TOUR.length).padStart(2, '0')}
              </p>
              <p className="text-[0.92rem] leading-relaxed text-[var(--color-ink)]">{step.line}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {tour! < TOUR.length - 1 ? (
                  <button type="button" className="btn btn-solid min-h-9 px-4 text-[0.62rem] whitespace-nowrap" style={{ ['--env-accent' as string]: '#ff9b52' }} onClick={() => stepTour(1)}>
                    Next stop →
                  </button>
                ) : (
                  <button type="button" className="btn btn-solid min-h-9 px-4 text-[0.62rem] whitespace-nowrap" style={{ ['--env-accent' as string]: '#ff9b52' }} onClick={() => setTour(null)}>
                    Finish
                  </button>
                )}
                {tour! > 0 && (
                  <button type="button" className="btn btn-quiet min-h-9 text-[0.62rem] whitespace-nowrap" onClick={() => stepTour(-1)}>
                    Back
                  </button>
                )}
                <button type="button" className="btn btn-quiet ml-auto min-h-9 text-[0.62rem]" onClick={() => setTour(null)}>
                  End tour
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[0.92rem] leading-relaxed text-[var(--color-ink)]">
                <strong className="font-medium text-[#ffb27a]">Woof!</strong> I'm Clover, the guide around here. Want me to show you around?
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" className="btn btn-solid min-h-9 px-4 text-[0.62rem] whitespace-nowrap" style={{ ['--env-accent' as string]: '#ff9b52' }} onClick={startTour}>
                  Show me around
                </button>
                <button type="button" className="btn btn-quiet min-h-9 text-[0.62rem] whitespace-nowrap" onClick={dismissGreeting}>
                  Maybe later
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* The chat. */}
      {open && (
        <>
          {compact && <div className="fixed inset-0 z-50 bg-black/55" onClick={closeClover} aria-hidden="true" style={{ animation: 'fade-in 200ms ease both' }} />}
          <div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal={compact ? 'true' : 'false'}
            aria-labelledby="clover-chat-title"
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden outline-none',
              compact
                ? 'inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] h-[min(76svh,600px)] rounded-[22px]'
                : 'right-6 bottom-24 h-[min(620px,calc(100vh-8rem))] w-[390px] rounded-[22px]',
            )}
            style={{
              background: 'linear-gradient(180deg, #121730 0%, #0a0d1c 30%, #070914 100%)',
              border: '1px solid color-mix(in oklab, #ff9b52 26%, #8fe6ff 10%)',
              boxShadow: '0 40px 100px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.03) inset',
              animation: 'pop-in 360ms var(--ease-out-expo) both',
            }}
          >
            {/* header */}
            <div className="relative flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: 'radial-gradient(circle at 50% 40%, #2a2140, #0d0f1d)' }}>
                <CloverHead size={44} mood={mood} blinking={blinking} />
              </div>
              <div className="min-w-0">
                <h2 id="clover-chat-title" className="font-display text-[0.98rem] font-normal tracking-[-0.01em] text-[var(--color-ink)]">
                  Clover
                </h2>
                <p className="label truncate text-[0.58rem] text-[#9aa6c4]">Local guide · no AI</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  closeClover();
                  launcherRef.current?.focus();
                }}
                className="ml-auto grid h-10 w-10 place-items-center rounded-full text-[var(--color-ink-dim)] transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close chat with Clover"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                  <path d="M2 2l10 10M12 2 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* messages */}
            <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation with Clover" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="clover-msg flex justify-start">
                <div className="max-w-[86%] rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.045] px-3.5 py-2.5 text-[0.9rem] leading-relaxed text-[var(--color-ink)]">
                  <span className="sr-only">Clover: </span>
                  <p>Woof! I'm Clover, AJ's digital dog and your guide around here.</p>
                  <p className="mt-1.5">
                    I can show you around, take you anywhere on the site, or answer questions about AJ. The suggestions below follow whichever chapter you're reading.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={startTour}
                      className="rounded-full border border-[#ff9b52]/40 px-3 py-1.5 text-[0.76rem] text-[#ffc596] transition-colors hover:bg-[#ff9b52]/12"
                    >
                      Give me the tour
                    </button>
                  </div>
                </div>
              </div>
              {messages.map((m) => (
                <div key={m.id} className={cn('clover-msg flex', m.from === 'you' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[0.9rem] leading-relaxed',
                      m.from === 'you'
                        ? 'rounded-br-md bg-[linear-gradient(120deg,#ffffff,#d5d9e2)] text-[#0a0a0d]'
                        : 'rounded-bl-md border border-white/[0.06] bg-white/[0.045] text-[var(--color-ink)]',
                    )}
                  >
                    {m.from === 'you' && <span className="sr-only">You: </span>}
                    {m.from === 'clover' && <span className="sr-only">Clover: </span>}
                    {m.lines.map((l, i) =>
                      m.proclaim && i === m.lines.length - 1 ? (
                        <p key={i} className="clover-proclaim mt-2.5">
                          <CrownMark />
                          <strong className="font-normal">{l}</strong>
                        </p>
                      ) : (
                        <p key={i} className={cn(i > 0 && 'mt-1.5', l.startsWith('•') && 'mt-1 pl-1 text-[0.86rem] text-[var(--color-ink-dim)]', l.startsWith('*') && l.endsWith('*') && 'text-[0.84rem] text-[var(--color-ink-dim)] italic')}>
                          {l}
                        </p>
                      ),
                    )}
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.actions.map((a) => (
                          <button
                            key={a.label}
                            type="button"
                            onClick={() => runAction(a)}
                            className="rounded-full border border-[#ff9b52]/40 px-3 py-1.5 text-[0.76rem] text-[#ffc596] transition-colors hover:bg-[#ff9b52]/12"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start" aria-label="Clover is typing">
                  <div className="flex gap-1 rounded-2xl rounded-bl-md border border-white/[0.06] bg-white/[0.045] px-4 py-3.5">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-[#ffb27a]" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* suggestions + input */}
            <div className="border-t border-white/[0.07] px-3 pt-3 pb-3">
              <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[0.76rem] whitespace-nowrap text-[var(--color-ink-dim)] transition-colors hover:border-[#8fe6ff]/50 hover:text-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send(draft);
                  setDraft('');
                }}
              >
                <label htmlFor="clover-input" className="sr-only">
                  Ask Clover something
                </label>
                <input
                  id="clover-input"
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={240}
                  autoComplete="off"
                  placeholder="Ask about AJ, the site, or say “tour”"
                  className="h-11 min-w-0 flex-1 rounded-full border border-white/10 bg-black/30 px-4 text-[16px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-faint)] focus:border-[#8fe6ff]/60 sm:text-[0.9rem]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[linear-gradient(120deg,#ffb27a,#ff9b52)] text-[#1a0d04] transition-opacity disabled:opacity-35"
                  aria-label="Send"
                >
                  <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 7h11M7.5 2.5 12 7l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Launcher. Hidden behind the sheet on phones while it is open. */}
      {!(open && compact) && (
        <button
          ref={launcherRef}
          type="button"
          onClick={() => {
            dismissGreeting();
            if (open) closeClover();
            else openClover();
          }}
          aria-expanded={open}
          aria-label={open ? 'Close chat with Clover' : 'Chat with Clover, the site guide'}
          className="group fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 grid h-14 w-14 place-items-center rounded-full transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 sm:right-6 sm:bottom-6 sm:h-16 sm:w-16"
          style={{
            background: 'radial-gradient(circle at 50% 35%, #2b2244, #0b0d1a 75%)',
            border: '1px solid color-mix(in oklab, #ff9b52 45%, transparent)',
            boxShadow: '0 14px 40px -12px rgba(255,155,82,0.45), 0 0 0 4px rgba(3,4,10,0.6)',
          }}
        >
          <CloverHead size={compact ? 46 : 52} mood={open ? 'happy' : greeting || step ? 'curious' : mood} blinking={blinking} className="translate-y-[3px] transition-transform duration-300 group-hover:rotate-[-6deg]" />
          {!open && !greeting && !step && messages.length === 0 && (
            <span aria-hidden="true" className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-[#0b0d1a] bg-[#ff9b52]" />
          )}
        </button>
      )}
    </div>
  );
}

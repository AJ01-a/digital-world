import { useCallback, useEffect, useRef, useState } from 'react';
import { FINALE, IDENTITY, OUTRO } from '../data/content';
import { SCENE_MAP } from '../data/worlds';
import Button, { Arrow } from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import { observe } from '../hooks/useInView';
import { themeVars } from '../lib/theme';
import { cn } from '../lib/utils';
import { useActions, useDevice } from '../state/hooks';

/**
 * Add public links here later — anything left out simply does not render,
 * so the footer stays tidy either way. Only add channels you are happy for
 * anyone on the internet to use.
 */
const LINKS: { label: string; href: string }[] = [];

/*
 * public/finale/glass-break.mp4 is a 3.65s lossless cut of the original
 * effects pack (scripts/finale-clip.py): from black, a pane shatters and holds
 * open around the headline (`line`), then bursts outward past the camera and
 * is gone by `end`. Times are seconds into the clip. It is ~1.9 MB and only
 * requested once the visitor is getting close to the bottom of the page.
 */
const CLIP = { start: 0, line: 1.0, end: 3.45 };
const base = import.meta.env.BASE_URL;
const VIDEO = `${base}finale/glass-break.mp4`;
const posterSet = (type: 'avif' | 'webp') => [640, 1280, 1920].map((w) => `${base}finale/glass-hole-${w}.${type} ${w}w`).join(', ');

/*
 *   waiting — dark, the video loaded but still;
 *   playing — the glass breaks, the line appears inside it;
 *   done    — the final composition: mark, line, way back up.
 * It plays once per visit; "Replay" is the only way to see it again.
 */
type Phase = 'waiting' | 'playing' | 'done';

export default function Finale() {
  const { register, goTo } = useActions();
  const { reducedMotion, compact } = useDevice();
  const [phase, setPhase] = useState<Phase>(reducedMotion ? 'done' : 'waiting');
  const [lineIn, setLineIn] = useState(reducedMotion);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef(phase);
  const guard = useRef(0);
  /** Play as soon as the video can (it was asked for before it loaded). */
  const pending = useRef(false);
  /** Skip had focus — hand it to the composition rather than dropping it. */
  const refocus = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
    if (phase === 'done' && refocus.current) {
      refocus.current = false;
      backRef.current?.focus();
    }
  }, [phase]);
  useEffect(() => () => window.clearTimeout(guard.current), []);

  const sectionRef = useCallback((el: HTMLElement | null) => register('finale', el), [register]);

  const finish = useCallback(() => {
    window.clearTimeout(guard.current);
    pending.current = false;
    videoRef.current?.pause();
    setLineIn(true);
    setPhase('done');
  }, []);

  const run = useCallback(
    (v: HTMLVideoElement) => {
      pending.current = false;
      v.currentTime = CLIP.start;
      // Autoplay can be refused (power saving, data saver) — end gracefully.
      v.play()?.catch(finish);
    },
    [finish],
  );

  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v || failed) return finish();
    setLineIn(false);
    setPhase('playing');
    window.clearTimeout(guard.current);
    // Whatever happens to the network, the ending never hangs half-played.
    guard.current = window.setTimeout(finish, (CLIP.end - CLIP.start + 6) * 1000);
    if (v.readyState < 1) {
      pending.current = true;
      setSrc(VIDEO);
      return;
    }
    run(v);
  }, [failed, finish, run]);

  /* Load when the visitor is a screen away; play when the stage is mostly in
     view; if they scroll away mid-play, settle on the final composition. */
  useEffect(() => {
    if (!stage || reducedMotion) return;
    const stopNear = observe(stage, (e) => e.isIntersecting && setSrc(VIDEO), '100% 0px');
    const stopView = observe(
      stage,
      (e) => {
        const seen = e.isIntersecting && e.intersectionRatio >= 0.55;
        if (seen && phaseRef.current === 'waiting') play();
        else if (!seen && phaseRef.current === 'playing') finish();
      },
      '0px',
      0.55,
    );
    return () => {
      stopNear();
      stopView();
    };
  }, [stage, reducedMotion, play, finish]);

  /* Turning reduced motion on mid-visit settles it straight away. */
  useEffect(() => {
    if (reducedMotion && phaseRef.current !== 'done') finish();
  }, [reducedMotion, finish]);

  const onTime = () => {
    const t = videoRef.current?.currentTime ?? 0;
    if (t >= CLIP.line) setLineIn(true);
    if (t >= CLIP.end - 0.05 && phaseRef.current === 'playing') finish();
  };

  return (
    <section
      ref={sectionRef}
      id="finale"
      data-scene="finale"
      aria-labelledby="finale-title"
      style={themeVars(SCENE_MAP.finale.theme)}
      className={cn('finale relative', `is-${phase}`, lineIn && 'line-in')}
    >
      {/* The approach: the page darkens into the last scene. */}
      <div aria-hidden="true" className="finale-approach" />

      {/* The scene and the footer together are the last screen of the page. */}
      <div ref={setStage} className="finale-stage relative flex min-h-[100svh] flex-col overflow-hidden">
        <div className="finale-scene relative flex flex-1 items-center justify-center px-[var(--shell)] py-20">
          <picture className="finale-frame finale-poster pointer-events-none" aria-hidden="true">
            <source type="image/avif" srcSet={posterSet('avif')} sizes="100vw" />
            <source type="image/webp" srcSet={posterSet('webp')} sizes="100vw" />
            <img src={`${base}finale/glass-hole-640.webp`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </picture>
          <div className="finale-frame finale-video pointer-events-none" aria-hidden="true">
            <video
              ref={videoRef}
              src={src ?? undefined}
              muted
              playsInline
              preload={src ? 'auto' : 'none'}
              disablePictureInPicture
              tabIndex={-1}
              className="h-full w-full object-cover"
              onLoadedMetadata={(e) => (pending.current ? run(e.currentTarget) : undefined)}
              onTimeUpdate={onTime}
              onEnded={finish}
              onError={() => {
                setFailed(true);
                if (phaseRef.current !== 'done') finish();
              }}
            />
          </div>
          {/* White light on the left, red on the right — the intro's two sides, one last time. */}
          <div aria-hidden="true" className="finale-tint pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="finale-glow pointer-events-none absolute inset-0" />
          <div aria-hidden="true" className="finale-fade pointer-events-none absolute inset-x-0 h-24" />

          <div className="relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center text-center">
            <div className="finale-mark grid h-[72px] place-items-center">{phase === 'done' && <Logo size={72} draw sweep delay={150} />}</div>
            <h2 id="finale-title" className="finale-line display mt-8 max-w-[13ch] text-[clamp(2.1rem,1rem+4vw,4.6rem)] leading-[1.02] text-white">
              {FINALE.line}
            </h2>
            <p className="finale-sub serif mt-6 text-[clamp(1.2rem,1rem+0.8vw,1.7rem)] text-[color-mix(in_oklab,white_86%,var(--env-accent))]">{FINALE.sub}</p>
            <div className="finale-actions mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Button ref={backRef} variant="solid" onClick={() => goTo('home')}>
                <Arrow dir="up" />
                Back to the top
              </Button>
              {!failed && (
                <Button variant="ghost" onClick={play}>
                  {reducedMotion ? 'Play the ending' : 'Replay the ending'}
                </Button>
              )}
            </div>
          </div>

          {phase === 'playing' && (
            // Positioned by a wrapper: `.btn` sets its own position.
            <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 sm:bottom-7">
              <button
                type="button"
                onClick={(e) => {
                  refocus.current = document.activeElement === e.currentTarget;
                  finish();
                }}
                className="btn btn-quiet text-white/75 hover:text-white"
              >
                Skip
              </button>
            </div>
          )}
        </div>

        {/* Same side lanes as every chapter, so the rail never sits on top of it. */}
        <div className="px-[var(--shell)] min-[861px]:pr-[calc(var(--shell)+6rem)]">
          <footer className="mx-auto w-full max-w-[1180px] border-t border-[color-mix(in_oklab,var(--env-accent)_14%,transparent)] pt-8 pb-24 sm:pb-8">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <Logo size={34} detail="compact" />
                <div>
                  <p className="text-[1rem] text-[var(--color-ink)]">{OUTRO.thanks}</p>
                  <p className="label mt-1 text-[var(--env-tint)]">
                    {IDENTITY.name} · {IDENTITY.site}
                  </p>
                </div>
              </div>

              {LINKS.length > 0 && (
                <nav aria-label="Elsewhere" className="flex flex-wrap items-center justify-center gap-5">
                  {LINKS.map((l) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="label text-[var(--color-ink-dim)] transition-colors hover:text-[var(--env-accent)]"
                    >
                      {l.label}
                    </a>
                  ))}
                </nav>
              )}

              <p className="label text-center text-[var(--color-ink-faint)] sm:text-right">
                © {new Date().getFullYear()} · No cookies · No trackers
                {!compact && (
                  <>
                    {' · press '}
                    <kbd className="rounded border border-white/15 px-1.5 py-0.5">/</kbd>
                  </>
                )}
              </p>
            </div>
            <p className="mt-6 text-center text-[0.72rem] text-[var(--color-ink-faint)] sm:text-left">{FINALE.credit}</p>
          </footer>
        </div>
      </div>
    </section>
  );
}

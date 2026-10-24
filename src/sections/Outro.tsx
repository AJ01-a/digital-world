import { IDENTITY, OUTRO } from '../data/content';
import Button, { Arrow } from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useActions, useDevice } from '../state/hooks';

/**
 * Add public links here later — anything left out simply does not render,
 * so the footer stays tidy either way. Only add channels you are happy for
 * anyone on the internet to use.
 */
const LINKS: { label: string; href: string }[] = [];

export default function Outro() {
  const { goTo, setTerminalOpen, openClover } = useActions();
  const { compact } = useDevice();

  return (
    <SectionShell id="outro" header={false} align="center" className="text-center">
      <div className="mx-auto flex max-w-[780px] flex-col items-center">
        <Reveal>
          <Logo size={88} sweep />
        </Reveal>

        <h2 className="display mt-9 text-[clamp(2.2rem,1.4rem+3.4vw,4.2rem)]">
          <RevealWords text={OUTRO.head} />
        </h2>

        <Reveal delay={0.15} as="p" className="prose-lede mx-auto mt-7 text-center">
          {OUTRO.body}
        </Reveal>

        <Reveal delay={0.3} className="mt-12 w-full">
          <figure className="relative px-4">
            <span aria-hidden="true" className="hairline absolute inset-x-0 top-0 h-px" />
            <blockquote className="serif py-10 text-[clamp(1.45rem,1.1rem+1.7vw,2.3rem)] leading-snug text-[var(--color-ink)]">
              “{OUTRO.quote}”
            </blockquote>
            <span aria-hidden="true" className="hairline absolute inset-x-0 bottom-0 h-px" />
          </figure>
        </Reveal>

        <Reveal delay={0.4} className="mt-12 flex flex-col items-center gap-3 sm:flex-row">
          <Button variant="solid" onClick={() => goTo('home')}>
            <Arrow dir="left" />
            Start over
          </Button>
          <Button variant="ghost" onClick={() => openClover()}>
            Ask Clover anything
          </Button>
          {!compact && (
            <Button variant="quiet" onClick={() => setTerminalOpen(true)}>
              Or open the terminal
            </Button>
          )}
        </Reveal>
      </div>

      <footer className="mx-auto mt-24 w-full max-w-[1180px] border-t border-[color-mix(in_oklab,var(--env-accent)_14%,transparent)] pt-8 pb-16 sm:pb-4">
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

          <p className="label text-[var(--color-ink-faint)]">
            © {new Date().getFullYear()} · No cookies · No trackers
            {!compact && (
              <>
                {' · press '}
                <kbd className="rounded border border-white/15 px-1.5 py-0.5">/</kbd>
              </>
            )}
          </p>
        </div>
      </footer>
    </SectionShell>
  );
}

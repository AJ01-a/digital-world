import { motion } from 'motion/react';
import { IDENTITY, OUTRO } from '../data/content';
import Logo from '../components/ui/Logo';
import MagneticButton from '../components/ui/MagneticButton';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useExperience } from '../state/experience';

/**
 * Add your own links here later — anything you leave out simply does not
 * render, so the footer stays tidy either way.
 */
const LINKS: { label: string; href: string }[] = [];

export default function Outro() {
  const { goTo, setTerminalOpen, compact } = useExperience();

  return (
    <SectionShell id="outro" header={false} className="text-center">
      <div className="mx-auto flex max-w-[760px] flex-col items-center">
        <Reveal>
          <Logo size={56} animate={false} interactive={false} />
        </Reveal>

        <h2 className="display mt-9 text-[clamp(2.4rem,1.6rem+3.4vw,4.4rem)]">
          <RevealWords text={OUTRO.head} />
        </h2>

        <Reveal delay={0.15} as="p" className="prose-lede mt-7 text-center">
          {OUTRO.body}
        </Reveal>

        <Reveal delay={0.3} className="mt-14 w-full">
          <figure className="relative px-6">
            <span aria-hidden="true" className="hairline absolute inset-x-0 top-0 h-px" />
            <blockquote
              className="py-10 text-[clamp(1.3rem,1rem+1.7vw,2.1rem)] leading-snug font-light text-[var(--color-ink)] italic"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              “{OUTRO.quote}”
            </blockquote>
            <span aria-hidden="true" className="hairline absolute inset-x-0 bottom-0 h-px" />
          </figure>
        </Reveal>

        <Reveal delay={0.4} className="mt-14 flex flex-col items-center gap-4 sm:flex-row">
          <MagneticButton variant="solid" onClick={() => goTo('home')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M13 7H2M6.5 2.5 2 7l4.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Start over
          </MagneticButton>
          <MagneticButton variant="quiet" onClick={() => setTerminalOpen(true)}>
            Or open the terminal
          </MagneticButton>
        </Reveal>
      </div>

      <motion.footer
        className="mx-auto mt-28 w-full max-w-[1180px] border-t border-[color-mix(in_oklab,var(--env-accent)_14%,transparent)] pt-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-[1.05rem] text-[var(--color-ink)]">{OUTRO.thanks}</p>
            <p className="mt-1 font-mono text-[0.62rem] tracking-[0.26em] text-[var(--env-tint)] uppercase">
              {IDENTITY.full}
            </p>
          </div>

          {LINKS.length > 0 && (
            <nav aria-label="Elsewhere" className="flex flex-wrap items-center justify-center gap-5">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-mono text-[0.65rem] tracking-[0.2em] text-[var(--color-ink-dim)] uppercase transition-colors hover:text-[var(--env-accent)]"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <p className="font-mono text-[0.58rem] tracking-[0.2em] text-[var(--color-ink-faint)] uppercase">
            © {new Date().getFullYear()}
            {!compact && (
              <>
                {' · press '}
                <kbd className="rounded border border-white/15 px-1.5 py-0.5">/</kbd> anywhere
              </>
            )}
          </p>
        </div>
      </motion.footer>
    </SectionShell>
  );
}

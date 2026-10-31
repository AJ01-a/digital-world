import { OUTRO } from '../data/content';
import Button, { Arrow } from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import Reveal, { RevealWords } from '../components/ui/Reveal';
import SectionShell from '../components/ui/SectionShell';
import { useActions, useDevice } from '../state/hooks';

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
    </SectionShell>
  );
}

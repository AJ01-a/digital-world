import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useMemo } from 'react';
import { useExperience } from '../state/experience';
import ParticleField from './ParticleField';
import {
  CircuitScape,
  HorizonScape,
  CityScape,
  MoonScape,
  MountainScape,
  NatureScape,
  NorthScape,
  TreeScape,
} from './Silhouettes';

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

type ScapeKey = 'tree' | 'moon' | 'north' | 'mountain' | 'city' | 'nature' | 'circuit' | 'horizon' | 'none';

const SCAPES: Record<Exclude<ScapeKey, 'none'>, (props?: { align?: string }) => React.ReactElement> = {
  tree: TreeScape,
  moon: MoonScape,
  north: NorthScape,
  mountain: MountainScape,
  city: CityScape,
  nature: NatureScape,
  circuit: CircuitScape,
  horizon: HorizonScape,
};

export default function BackgroundStage() {
  const { active, override, theme, particles, intensity, reducedMotion } = useExperience();

  const scape: Exclude<ScapeKey, 'none'> = useMemo(() => {
    if (active === 'games') return override ? (override.particles === 'embers' ? 'tree' : override.particles === 'leaves' ? 'moon' : override.particles === 'snow' ? 'north' : 'mountain') : 'tree';
    if (active === 'driving') return 'city';
    if (active === 'dog') return 'nature';
    if (active === 'tech' || active === 'omarchy' || active === 'automation') return 'circuit';
    return 'horizon';
  }, [active, override]);

  // Pointer parallax — small enough to feel like depth, not movement.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 40, damping: 20, mass: 0.6 });
  const artX = useTransform(sx, (v) => `${v * -16}px`);
  const artY = useTransform(sy, (v) => `${v * -10}px`);
  const glowX = useTransform(sx, (v) => `${v * 28}px`);
  const glowY = useTransform(sy, (v) => `${v * 18}px`);

  useEffect(() => {
    if (reducedMotion) return;
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [mx, my, reducedMotion]);

  const Scape = SCAPES[scape];

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base atmosphere — cross-fades because --env-* are registered properties. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 85% at 50% 4%, var(--env-b) 0%, var(--env-a) 42%, var(--env-void) 78%, var(--env-void) 100%)',
        }}
      />

      {/* Ambient light pools */}
      <motion.div className="absolute inset-0" style={{ x: glowX, y: glowY }}>
        <div
          className="env-blob absolute -top-[22%] left-[8%] h-[70vmax] w-[70vmax] rounded-full opacity-35 blur-[90px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, var(--env-ray) 0%, transparent 62%)',
            animation: 'float-a 26s ease-in-out infinite',
          }}
        />
        <div
          className="env-blob absolute right-[2%] bottom-[-30%] h-[60vmax] w-[60vmax] rounded-full opacity-26 blur-[100px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, var(--env-accent) 0%, transparent 60%)',
            animation: 'float-b 34s ease-in-out infinite',
          }}
        />
      </motion.div>

      {/* Volumetric shafts */}
      <div
        className="absolute inset-x-0 top-0 hidden h-[85vh] opacity-[0.13] mix-blend-screen md:block"
        style={{
          background:
            'repeating-linear-gradient(102deg, transparent 0 60px, color-mix(in oklab, var(--env-accent) 55%, transparent) 60px 61px, transparent 61px 150px)',
          maskImage: 'radial-gradient(70% 60% at 50% 0%, #000 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 0%, #000 0%, transparent 75%)',
        }}
      />

      {/* World artwork — pushed low so headlines sit in clean sky */}
      <motion.div className="absolute inset-0" style={{ x: artX, y: artY, scale: 1.08, translateY: '4%' }}>
        <AnimatePresence mode="sync">
          {(
            <motion.div
              key={scape}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.05, filter: 'blur(14px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.03, filter: 'blur(18px)' }}
              transition={{ duration: reducedMotion ? 0.001 : 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Scape />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cinematic scrim: keeps type readable over any environment */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in oklab, var(--env-void) 70%, transparent) 0%, transparent 30%, transparent 58%, color-mix(in oklab, var(--env-void) 72%, transparent) 100%)',
        }}
      />

      {intensity > 0 && (
        <ParticleField mode={particles} accent={theme.accent} ray={theme.ray} intensity={intensity} />
      )}

      {/* Depth + grain */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(100% 78% at 50% 42%, transparent 28%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,0.78) 100%)' }}
      />
      <div
        className="absolute inset-0 hidden opacity-[0.045] mix-blend-overlay md:block"
        style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }}
      />
    </div>
  );
}

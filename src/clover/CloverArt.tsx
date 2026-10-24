import { cn } from '../lib/utils';

/*
 * Clover, drawn as flat vector shapes.
 *
 * Inspired by AJ's real dog — a Great Pyrenees × Bernese Mountain Dog mix,
 * orange and white. The design leans on what makes that mix recognisable:
 * a big fluffy white ruff, floppy orange ears, an orange cap split by a white
 * blaze, and the small tan "brow spots" Berners have above their eyes. The
 * cyan collar tag is the one piece of the site's own palette he wears.
 */

export type Mood = 'idle' | 'happy' | 'curious' | 'thinking';

const FUR = '#f7f3eb';
const FUR_SHADE = '#e6dece';
const ORANGE = '#e9792c';
const ORANGE_DEEP = '#bf581b';
const TAN = '#ffc489';
const INK = '#1a1220';

/** Front-facing head — the avatar used by the launcher and the chat. */
export function CloverHead({
  size = 56,
  mood = 'idle',
  blinking = false,
  className,
}: {
  size?: number;
  mood?: Mood;
  blinking?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn('overflow-visible', `mood-${mood}`, blinking && 'is-blinking', className)}
    >
      <g className="clover-head">
        {/* Ears sit behind the head. */}
        <path className="clover-ear-l" d="M40 30 C28 28 15 40 14 57 C13 69 19 77 27 76 C35 75 38 62 43 47 Z" fill={ORANGE} />
        <path className="clover-ear-r" d="M80 30 C92 28 105 40 106 57 C107 69 101 77 93 76 C85 75 82 62 77 47 Z" fill={ORANGE} />
        <path d="M37 36 C30 40 25 50 25 60" stroke={ORANGE_DEEP} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M83 36 C90 40 95 50 95 60" stroke={ORANGE_DEEP} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Scalloped ruff — the Pyrenees fluff. */}
        <g fill={FUR}>
          <circle cx="33" cy="78" r="15" />
          <circle cx="87" cy="78" r="15" />
          <circle cx="42" cy="92" r="14" />
          <circle cx="78" cy="92" r="14" />
          <circle cx="60" cy="97" r="15" />
          <circle cx="26" cy="68" r="9" />
          <circle cx="94" cy="68" r="9" />
        </g>
        <path d="M30 88 Q34 92 38 90 M82 90 Q86 92 90 88 M52 104 Q56 107 60 105 Q64 107 68 104" stroke={FUR_SHADE} strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* Head dome. */}
        <ellipse cx="60" cy="58" rx="31" ry="30" fill={FUR} />

        {/* Orange cap with the white blaze down the middle. */}
        <path d="M60 30 C48 27 33 33 30.5 48 C29 58 32 66 40 68 C46 69 50 64 52 57 C54 49 55 40 60 30 Z" fill={ORANGE} />
        <path d="M60 30 C72 27 87 33 89.5 48 C91 58 88 66 80 68 C74 69 70 64 68 57 C66 49 65 40 60 30 Z" fill={ORANGE} />
        <path d="M51 31.5 Q54 23 58 29 Q60 21 62 29 Q66 23 69 31.5 Q60 28 51 31.5 Z" fill={ORANGE} />

        {/* Tan brow spots. */}
        <ellipse cx="45.5" cy="44" rx="3.4" ry="2.3" fill={TAN} />
        <ellipse cx="74.5" cy="44" rx="3.4" ry="2.3" fill={TAN} />

        {/* Eyes. */}
        <g className="clover-eyes">
          <ellipse cx="46" cy="54" rx="5.3" ry="5.9" fill={INK} />
          <ellipse cx="74" cy="54" rx="5.3" ry="5.9" fill={INK} />
          <g className="clover-pupils" fill="#fff">
            <circle cx="44.2" cy="51.8" r="1.9" />
            <circle cx="72.2" cy="51.8" r="1.9" />
            <circle cx="47.6" cy="56.4" r="0.9" opacity="0.7" />
            <circle cx="75.6" cy="56.4" r="0.9" opacity="0.7" />
          </g>
        </g>

        {/* Muzzle. */}
        <ellipse cx="60" cy="74" rx="15" ry="11.5" fill="#fdfaf4" />
        <ellipse cx="60" cy="80" rx="11" ry="5.5" fill={FUR_SHADE} opacity="0.55" />
        <path d="M53.5 66 Q60 62.5 66.5 66 Q66 71.5 60 73 Q54 71.5 53.5 66 Z" fill={INK} />
        <ellipse cx="58" cy="66.3" rx="2.2" ry="1" fill="#fff" opacity="0.5" />
        <path
          className="clover-tongue"
          d="M56.4 78.2 Q56.4 87 60 87 Q63.6 87 63.6 78.2 Z"
          fill="#ff8fa3"
        />
        <path d="M60 73 V76.6 M60 76.6 Q56 80.6 52 78.6 M60 76.6 Q64 80.6 68 78.6" stroke="#3b2a2c" strokeWidth="1.4" fill="none" strokeLinecap="round" />

        {/* Collar and tag. */}
        <path d="M39 101 Q60 111 81 101" stroke="#6b5bd6" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="60" cy="108" r="4.6" fill="#5ce1ff" />
        <circle cx="58.6" cy="106.6" r="1.4" fill="#fff" opacity="0.8" />
      </g>
    </svg>
  );
}

/** Side-on, full body — walks across the Clover chapter. */
export function CloverBody({ animated, className }: { animated: boolean; className?: string }) {
  const a = (cls: string) => (animated ? cls : undefined);
  return (
    <svg viewBox="0 0 200 130" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <g className={a('anim-bob')}>
        {/* far legs */}
        <g fill={FUR_SHADE}>
          <g className={a('anim-leg-b')} style={{ transformOrigin: '66px 86px' }}>
            <path d="M58 82 h15 l-2 30 h-10 z" />
            <circle cx="60" cy="90" r="5" />
            <ellipse cx="66" cy="114" rx="8" ry="4.5" />
          </g>
          <g className={a('anim-leg-a')} style={{ transformOrigin: '128px 86px' }}>
            <path d="M121 82 h14 l-2 30 h-10 z" />
            <ellipse cx="128" cy="114" rx="8" ry="4.5" />
          </g>
        </g>

        {/* tail plume — a feathered Pyrenees flag carried over the back */}
        <g className={a('anim-wag')} style={{ transformOrigin: '52px 60px' }}>
          <path d="M54 60 C40 57 30 46 31 33 C32 23 40 17 49 20" stroke={FUR} strokeWidth="13" strokeLinecap="round" fill="none" />
          <g fill={FUR}>
            <circle cx="36" cy="52" r="7" />
            <circle cx="28" cy="42" r="7" />
            <circle cx="26" cy="31" r="6.5" />
            <circle cx="31" cy="21" r="6" />
            <circle cx="41" cy="15" r="5.5" />
            <circle cx="51" cy="17" r="5" />
          </g>
          <path d="M30 40 C29 34 31 28 35 24 M38 50 C34 46 33 42 33 38" stroke={FUR_SHADE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* body */}
        <ellipse cx="96" cy="72" rx="50" ry="25" fill={FUR} />
        {/* orange saddle */}
        <path d="M50 64 C54 46 88 40 114 44 C128 46 138 54 140 62 C122 58 74 58 50 64 Z" fill={ORANGE} />
        <path d="M70 52 q4 -3 8 0 M92 49 q4 -3 8 0 M112 51 q4 -3 8 0" stroke={ORANGE_DEEP} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.7" />
        {/* belly fluff */}
        <g fill={FUR}>
          {[62, 74, 86, 98, 110, 122].map((x, i) => (
            <circle key={x} cx={x} cy={92 + (i % 2)} r="7" />
          ))}
        </g>
        <path d="M66 78 q3 3 6 0 M88 80 q3 3 6 0 M110 79 q3 3 6 0" stroke={FUR_SHADE} strokeWidth="1.3" fill="none" strokeLinecap="round" />

        {/* near legs */}
        <g fill={FUR}>
          <g className={a('anim-leg-a')} style={{ transformOrigin: '76px 86px' }}>
            <path d="M67 82 h16 l-2 31 h-11 z" />
            <circle cx="69" cy="92" r="5.5" />
            <circle cx="70" cy="100" r="4.5" />
            <ellipse cx="76" cy="115" rx="9" ry="5" />
          </g>
          <g className={a('anim-leg-b')} style={{ transformOrigin: '140px 86px' }}>
            <path d="M132 82 h15 l-2 31 h-11 z" />
            <circle cx="133" cy="92" r="4.5" />
            <ellipse cx="140" cy="115" rx="9" ry="5" />
          </g>
        </g>

        {/* chest ruff */}
        <g fill={FUR}>
          <circle cx="140" cy="70" r="17" />
          <circle cx="146" cy="82" r="11" />
          <circle cx="132" cy="84" r="10" />
        </g>

        {/* head */}
        <g>
          <ellipse cx="160" cy="48" rx="20" ry="18" fill={FUR} />
          <path d="M141 46 C141 32 156 26 168 29 C175 31 178 36 178 40 C170 38 164 40 161 48 C156 52 146 52 141 46 Z" fill={ORANGE} />
          <ellipse cx="166" cy="37" rx="2.4" ry="1.6" fill={TAN} />
          <ellipse cx="175" cy="55" rx="12" ry="8.5" fill="#fdfaf4" />
          <ellipse cx="186" cy="51" rx="3.8" ry="3.1" fill={INK} />
          <path d="M175 60 Q180 62 185 58" stroke="#3b2a2c" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <ellipse cx="167" cy="43" rx="2.9" ry="3.2" fill={INK} />
          <circle cx="166.2" cy="42" r="1" fill="#fff" />
          {/* ear */}
          <path d="M150 32 C141 33 138 46 141 58 C144 63 151 60 153 52 C155 44 154 37 150 32 Z" fill={ORANGE} />
          <path d="M147 38 C144 44 144 50 145 55" stroke={ORANGE_DEEP} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
          {/* collar */}
          <path d="M146 60 Q152 70 162 64" stroke="#6b5bd6" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="155" cy="70" r="3.6" fill="#5ce1ff" />
        </g>
      </g>
    </svg>
  );
}

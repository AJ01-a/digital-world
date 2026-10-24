// Fills in the starfield and the AJ emblem for the static brand images.
// Geometry matches src/components/ui/Logo.tsx.
(() => {
  const host = document.getElementById('stars');
  const W = document.body.clientWidth;
  const H = document.body.clientHeight;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < Math.round((W * H) / 3000); i++) {
    const s = document.createElement('i');
    s.className = 'star';
    const r = 0.6 + rnd() ** 3 * 2.4;
    const t = rnd();
    const c = t > 0.93 ? '255,178,120' : t > 0.78 ? '140,225,255' : t > 0.68 ? '185,165,255' : '225,235,255';
    s.style.cssText = `width:${r}px;height:${r}px;left:${rnd() * W}px;top:${rnd() * H}px;background:rgba(${c},${0.2 + rnd() * 0.6})`;
    host.appendChild(s);
  }

  const MARK = 'M28 80 L54 24 H68 V76 Q68 94 50 94 H40';
  const BAR = 'M37 60 H68';
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r1 = i % 6 === 0 ? 186 : 190;
    return `<line x1="${200 + Math.cos(a) * r1}" y1="${200 + Math.sin(a) * r1}" x2="${200 + Math.cos(a) * 196}" y2="${200 + Math.sin(a) * 196}"/>`;
  }).join('');

  const svg = `
  <svg viewBox="0 0 400 400" width="100%" height="100%" style="overflow:visible">
    <defs>
      <linearGradient id="g" x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stop-color="#f4f9ff"/><stop offset="0.4" stop-color="#8fe6ff"/>
        <stop offset="0.62" stop-color="#5ce1ff"/><stop offset="1" stop-color="#9b86ff"/>
      </linearGradient>
      <radialGradient id="disc" cx="50%" cy="35%" r="65%">
        <stop offset="0" stop-color="#141e40"/><stop offset="1" stop-color="#04060e"/>
      </radialGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#5ce1ff" stop-opacity="0.25"/><stop offset="0.6" stop-color="#9b86ff" stop-opacity="0.08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
      <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">
        <g fill="none" stroke="#fff"><path d="${MARK}" stroke-width="9"/><path d="${BAR}" stroke-width="7"/></g>
      </mask>
    </defs>
    <circle cx="200" cy="200" r="170" fill="url(#glow)"/>
    <circle cx="200" cy="200" r="196" fill="none" stroke="#8fe6ff" stroke-opacity="0.45"/>
    <g stroke="#b8d4ff" stroke-opacity="0.35">${ticks}</g>
    <circle cx="200" cy="4" r="4" fill="#5ce1ff"/>
    <circle cx="${200 + Math.cos(2.4) * 196}" cy="${200 + Math.sin(2.4) * 196}" r="3" fill="#9b86ff"/>
    <circle cx="200" cy="200" r="148" fill="none" stroke="#9b86ff" stroke-opacity="0.22" stroke-dasharray="60 14 4 14"/>
    <circle cx="${200 + Math.cos(-0.7) * 148}" cy="${200 + Math.sin(-0.7) * 148}" r="4.5" fill="#ff9b52"/>
    <circle cx="200" cy="200" r="104" fill="url(#disc)" stroke="#ffffff" stroke-opacity="0.06"/>
    <g transform="translate(112 112) scale(1.4667)">
      <g fill="none">
        <path d="M30 6 H90 L114 30 V90 L90 114 H30 L6 90 V30 Z" stroke="url(#g)" stroke-opacity="0.5" stroke-width="1.4"/>
        <path d="M33 12 H87 L108 33 V87 L87 108 H33 L12 87 V33 Z" stroke="#8fe6ff" stroke-opacity="0.18" stroke-width="0.8" stroke-dasharray="2 4"/>
        <path d="M60 0 V6 M60 114 V120 M0 60 H6 M114 60 H120" stroke="#b8d4ff" stroke-opacity="0.7" stroke-width="1.4"/>
      </g>
      <rect x="99.5" y="15.5" width="4" height="4" fill="#ff9b52" transform="rotate(45 101.5 17.5)"/>
      <g fill="none" stroke="#2c2370" transform="translate(2.6 2.6)"><path d="${MARK}" stroke-width="9"/><path d="${BAR}" stroke-width="7"/></g>
      <g fill="none" stroke="url(#g)">
        <path d="${MARK}" stroke-width="9"/><path d="${BAR}" stroke-width="7"/>
        <path d="M68 60 H82 L88 54" stroke-width="2.2" stroke-linecap="round"/>
      </g>
      <circle cx="91" cy="51" r="6.5" fill="none" stroke="#ff9b52" stroke-opacity="0.4"/>
      <circle cx="91" cy="51" r="3.4" fill="#ff9b52"/>
      <g mask="url(#m)"><g fill="none" stroke="#fff" stroke-opacity="0.55" stroke-width="1.3" transform="translate(-2.4 -2.2)"><path d="${MARK}"/><path d="M46 60 H68"/></g></g>
    </g>
  </svg>`;
  for (const el of document.querySelectorAll('.emblem')) el.innerHTML = svg;
})();

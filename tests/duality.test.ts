import test from 'node:test';
import assert from 'node:assert/strict';
import { compose, faceRect, type Rect } from '../src/lib/duality.ts';

const SCREENS: [number, number][] = [
  [320, 568], [360, 740], [390, 844], [430, 932], // phones
  [768, 1024], [820, 1180], // tablets, portrait
  [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080], [2560, 1080], // wide
  [844, 390], // phone, landscape
];

const inside = ([x, y]: [number, number], r: Rect) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Which side of the boundary a point is on, by the nearest boundary sample. */
function sideOf(c: ReturnType<typeof compose>, [x, y]: [number, number], sway: number) {
  const line = c.boundary(sway);
  if (c.stacked) {
    const p = line.reduce((a, b) => (Math.abs(b[0] - x) < Math.abs(a[0] - x) ? b : a));
    return y < p[1] ? 'white' : 'red';
  }
  const p = line.reduce((a, b) => (Math.abs(b[1] - y) < Math.abs(a[1] - y) ? b : a));
  return x < p[0] ? 'white' : 'red';
}

for (const [w, h] of SCREENS) {
  test(`duality layout at ${w}×${h}`, () => {
    const c = compose(w, h);
    const whiteFace = faceRect(c.white, false);
    const redFace = faceRect(c.red, true);

    // White on the left, red on the right.
    assert.ok(whiteFace.x + whiteFace.w / 2 < redFace.x + redFace.w / 2, 'white face is left of red face');

    for (const [name, f] of [['white', whiteFace], ['red', redFace]] as const) {
      // Faces fully on screen — never cropped.
      assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.w <= w && f.y + f.h <= h, `${name} face on screen: ${JSON.stringify(f)}`);
      // Big enough to recognise.
      assert.ok(f.w >= 70, `${name} face is ${f.w.toFixed(0)}px wide`);
      // The boundary never crosses a face, however far it sways, and each face is on its own side.
      for (const sway of [-1, 0, 1]) {
        for (const p of c.boundary(sway)) assert.ok(!inside(p, f), `boundary crosses the ${name} face at sway ${sway}`);
        const corners: [number, number][] = [[f.x, f.y], [f.x + f.w, f.y], [f.x, f.y + f.h], [f.x + f.w, f.y + f.h]];
        for (const p of corners) assert.equal(sideOf(c, p, sway), name, `${name} face on its own side at sway ${sway}`);
      }
    }

    // The monogram sits between them, not on either face.
    const m = { x: c.mark.x - c.mark.size / 2, y: c.mark.y - c.mark.size / 2, w: c.mark.size, h: c.mark.size };
    assert.ok(!overlaps(m, whiteFace) && !overlaps(m, redFace), 'monogram clear of both faces');
    assert.ok(m.x >= 0 && m.x + m.w <= w && m.y >= 0 && m.y + m.h <= h, 'monogram on screen');
  });
}

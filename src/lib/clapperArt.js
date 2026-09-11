/* Everything PRINTED on the slate, painted to 2D canvases that the scene then
   wraps onto its meshes: the marked-up acrylic face, the record on the rear,
   the seven-segment readout, the stripes on the sticks, and the two utility
   maps (fine grain, brushed metal) the materials use for roughness and bump.

   Nothing here is lit. Light, shadow and reflection belong to the scene; this
   file only knows about ink on a surface, which is why it can repaint a face
   for a new production without touching a single material. */

/* Layout sizes, in the units every painter draws in. The canvases themselves
   may be denser — twice these on a capable machine, so the type is laid down at
   4200px across the face and stays crisp at Retina density — and each painter
   scales its context to match, so no coordinate here ever changes. */
export const FACE = { w: 2100, h: 1440 };
export const LED = { w: 1400, h: 235 };
export const STRIPE = { w: 2048, h: 256 };

/** Set the context to draw in layout units on a canvas of any density; returns the density. */
export function fitDensity(ctx, layout) {
  const k = ctx.canvas.width / layout.w;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  return k;
}

export function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return [canvas, canvas.getContext('2d')];
}

/* A small deterministic generator, so the scuffs and brush marks are the same
   on every visit rather than re-rolled each load. */
export function seededRandom(seed = 341) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/* ------------------------------------------------------------ utility maps */

/** Fine mid-grey noise: the tooth of the acrylic and the paint. */
export function paintNoise(size = 512, seed = 7) {
  const [canvas, ctx] = makeCanvas(size, size);
  const random = seededRandom(seed);
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = 128 + (random() - 0.5) * 70;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = n;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Brushed metal roughness: long faint strokes on a mid grey. */
export function paintBrushed(w = 1024, h = 512, seed = 19) {
  const [canvas, ctx] = makeCanvas(w, h);
  const random = seededRandom(seed);
  ctx.fillStyle = '#c8c8c8';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) {
    const y = random() * h;
    const x = random() * w;
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + random() * 0.065})`;
    ctx.lineWidth = 0.35 + random() * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 40 + random() * 280, y);
    ctx.stroke();
  }
  return canvas;
}

/* ------------------------------------------------------------- the sticks */

/** The stripes: paint on a solid rail, with sparse hairline scuffs at the edges. */
export function paintStripes(ctx, seed = 341) {
  const { w, h } = STRIPE;
  fitDensity(ctx, STRIPE);
  const random = seededRandom(seed);
  ctx.fillStyle = '#e7e5df';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#101114';
  for (let x = -200; x < w + 260; x += 266) {
    ctx.beginPath();
    ctx.moveTo(x + 92, 0);
    ctx.lineTo(x + 195, 0);
    ctx.lineTo(x + 103, h);
    ctx.lineTo(x, h);
    ctx.fill();
  }
  for (let i = 0; i < 55; i++) {
    const x = random() * w;
    const nearEdge = random() < 0.7;
    const y = nearEdge ? (random() < 0.5 ? random() * 14 : h - 14 + random() * 14) : random() * h;
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(18,19,22,.13)' : 'rgba(236,235,228,.16)';
    ctx.lineWidth = 0.45 + random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3 + random() * 22, y + random() * 3 - 1.5);
    ctx.stroke();
  }
}

/* ------------------------------------------------------------- the artwork */

/** Draw an image to fit inside a box, keeping its shape, centred. */
export function fitImage(ctx, img, x, y, w, h) {
  const aspect = img.width / img.height;
  let dw = w;
  let dh = w / aspect;
  if (dh > h) {
    dh = h;
    dw = h * aspect;
  }
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/* How tall to draw a production's mark. Every supplied file is 200px tall, so
   drawing them all to one height made a stacked two-line lockup read half the
   size of a single-line wordmark. The height comes from the aspect ratio
   instead, so every mark lands at roughly the same visual weight. Same rule as
   logoHeight() in slateDeck.ts, scaled to the face's texel size. */
const MARK_SCALE = FACE.w / 760;
export function markHeight(img) {
  const aspect = img.width / Math.max(1, img.height);
  const px = Math.min(90, Math.max(46, 112 / Math.sqrt(aspect)));
  return px * MARK_SCALE;
}

const artCache = new Map();

/* The site's SVG marks are drawn onto a canvas here, and a canvas rasterises
   an SVG at its declared size — which for several of them is tiny (FX is
   121px) or absent (Apple TV has only a viewBox, so it lands at 300px). Each
   SVG is fetched and re-declared at a generous size before it is loaded, so
   the mark on the board is crisp rather than upscaled. PNGs load as they are. */
export function loadArt(src, options = {}) {
  if (!src) return Promise.resolve(null);
  /* `ink: 'light'` swaps black and white in an SVG's fills, for a mark that has
     to sit on a dark surface — a real second asset, rather than a canvas
     filter that not every browser honours */
  const lightInk = options.ink === 'light';
  const cacheKey = lightInk ? `${src}#light` : src;
  if (artCache.has(cacheKey)) return artCache.get(cacheKey);
  const promise = (async () => {
    try {
      let url = src;
      let revoke = null;
      if (/\.svg(\?|$)/i.test(src)) {
        const response = await fetch(src);
        if (!response.ok) return null;
        const text = await response.text();
        const source = lightInk
          ? text.replace(/fill="(black|#000000|#000)"/gi, 'fill="__t3light__"').replace(/fill="(white|#ffffff|#fff)"/gi, 'fill="black"').replace(/__t3light__/g, 'white')
          : text;
        const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
        const root = doc.documentElement;
        if (root.nodeName.toLowerCase() === 'svg') {
          let box = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
          const width = parseFloat(root.getAttribute('width'));
          const height = parseFloat(root.getAttribute('height'));
          if (box.length !== 4 || box.some((n) => !Number.isFinite(n))) {
            box = [0, 0, width || 300, height || 150];
            root.setAttribute('viewBox', box.join(' '));
          }
          const aspect = box[2] / box[3];
          const target = 1600;
          root.setAttribute('width', String(target));
          root.setAttribute('height', String(Math.round(target / aspect)));
          const blob = new Blob([new XMLSerializer().serializeToString(root)], { type: 'image/svg+xml' });
          url = URL.createObjectURL(blob);
          revoke = url;
        }
      }
      const img = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = url;
      });
      if (revoke) URL.revokeObjectURL(revoke);
      return img && img.width ? img : null;
    } catch {
      return null;
    }
  })();
  artCache.set(cacheKey, promise);
  return promise;
}

/* ---------------------------------------------------------------- the face */

const INK = '#08080a';
const RED = '#a8221c';

/**
 * The marked-up acrylic: labels set in Jost, the marker hand in Caveat, the
 * studio's mark in its cell and the production's in the band at the foot.
 * `art` carries the two loaded marks (or null, in which case the name is set in
 * type instead — exactly as the client logo wall does).
 */
export function paintFace(ctx, card, art = {}, options = {}) {
  const { w, h } = FACE;
  fitDensity(ctx, FACE);
  /* what a variant of the board prints differently: the label over the mark's
     cell, the box that mark fills, a line of type where a title mark would go,
     and the credit line */
  const {
    studioLabel = 'STUDIO',
    markBox = [747, 426, 615, 137],
    bandText = null,
    creditLine = null,
  } = options;

  const line = (x1, y1, x2, y2) => {
    ctx.strokeStyle = '#111114';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  const label = (text, x, y) => {
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.font = '700 36px Jost, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText(text, x, y);
    ctx.letterSpacing = '0px';
  };
  const hand = (text, x, y, size = 108, colour = INK) => {
    const value = String(text ?? '');
    ctx.textAlign = 'center';
    ctx.font = `700 ${size}px Caveat, "Segoe Script", cursive`;
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.032);
    ctx.strokeStyle = colour;
    ctx.strokeText(value, x, y);
    ctx.fillStyle = colour;
    ctx.fillText(value, x, y);
  };

  /* the acrylic, and the near-black band at the foot */
  ctx.fillStyle = '#ecebe7';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0c0d10';
  ctx.fillRect(0, 1027, w, h - 1027);

  /* head row: fps, the readout window (the LED is its own mesh), stop */
  label('FPS', 38, 63);
  label('STOP', 1930, 63);
  hand(card.fps, 142, 217, 94);
  hand(card.stop, 1940, 217, 94);

  /* the grid */
  line(0, 350, w, 350);
  line(0, 600, w, 600);
  line(0, 808, w, 808);
  line(0, 1027, w, 1027);
  line(550, 350, 550, 600);
  line(1490, 350, 1490, 600);

  /* roll · studio · take */
  label('ROLL', 35, 397);
  label(studioLabel, 580, 397);
  label('TAKE', 1525, 397);
  const roll = String(card.roll ?? '');
  hand(roll.slice(0, 1), 160, 534, 130, RED);
  hand(roll.slice(1), 291, 533, 123);
  hand(String(card.take ?? '3'), 1780, 537, 125);
  if (art.studio) {
    fitImage(ctx, art.studio, ...markBox);
  } else {
    ctx.fillStyle = '#191a1e';
    ctx.textAlign = 'center';
    ctx.font = '400 84px Anton, Impact, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(String(card.studio ?? '').replace(/-/g, ' ').toUpperCase(), 1040, 552, 600);
    ctx.letterSpacing = '0px';
  }

  /* res · lens · slate · filter */
  const cols = [0, 430, 1060, 1550, w];
  for (let i = 1; i < 4; i++) line(cols[i], 600, cols[i], 1027);
  ['RES', 'LENS', 'SLATE', 'FILTER'].forEach((text, i) => label(text, cols[i] + 28, 645));
  hand(card.res, 215, 755);
  hand(card.lens, 745, 755);
  hand(card.slate, 1305, 755);
  hand('—', 1825, 748);

  /* release · shutter · ct · ei */
  label('RELEASE', 28, 855);
  label('SHUTTER', 458, 855);
  label('CT °', 1088, 855);
  label('EI', 1578, 855);
  hand(card.release, 220, 970, 75);
  hand(card.shutter, 745, 970);
  hand(card.ct, 1305, 970);
  hand(card.ei, 1825, 970);

  /* the production's mark on the band, at its own visual weight */
  if (art.title) {
    const height = Math.min(markHeight(art.title), 275);
    const width = Math.min(950, height * (art.title.width / art.title.height));
    fitImage(ctx, art.title, 1050 - width / 2, 1063 + (275 - height) / 2, width, height);
  } else if (bandText) {
    /* the launch line, set across the band in Jost capitals, big enough to
       fill it */
    ctx.save();
    ctx.translate(1050, 1250);
    ctx.textAlign = 'center';
    ctx.font = '400 150px Jost, sans-serif';
    ctx.letterSpacing = '16px';
    ctx.fillStyle = '#f2efe8';
    ctx.fillText(String(bandText).toUpperCase(), 0, 0, 1980);
    ctx.letterSpacing = '0px';
    ctx.restore();
  } else {
    ctx.fillStyle = '#eeece6';
    ctx.font = '400 96px Anton, Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(card.title ?? '').toUpperCase(), 1050, 1236, 1700);
  }

  /* the credit line */
  ctx.font = '600 26px Jost, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c4c4c5';
  const unit = String(card.unit ?? 'Main Unit').toUpperCase();
  const city = String(card.city ?? 'London').toUpperCase();
  ctx.fillText(creditLine ?? `CASTING  |  TAKE 3  |  ${unit}  |  ${city}`, 1050, 1370, 1950);
  ctx.letterSpacing = '0px';
}

/** A copy of a mark filled with one colour, keeping only its shape — for a
    black mark that has to sit on a dark plate. Works for PNG and SVG alike. */
export function tintMark(img, colour) {
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const [canvas, ctx] = makeCanvas(Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

/* ---------------------------------------------------------------- the rear */

/**
 * The agency's record, on the back of the board. Every figure is editorial
 * copy from credits.json — nothing here is computed or invented. Repainted on
 * a theme change: a near-black plate in the charcoal room, pale in the light.
 */
export function paintRear(ctx, record, theme = 'dark', art = {}) {
  const { w, h } = FACE;
  fitDensity(ctx, FACE);
  const dark = theme !== 'light';
  if (record?.kind === 'mark') return paintRearMark(ctx, record, dark, art);
  const ink = dark ? '#fbfaf7' : '#17181c';
  const quiet = dark ? 'rgba(251,250,247,.8)' : 'rgba(23,24,28,.9)';
  const rule = dark ? '#44464b' : '#a3a29e';

  /* a matte plate, a step lighter than the chassis so the type has room to be white */
  ctx.fillStyle = dark ? '#15171b' : '#dcdcd6';
  ctx.fillRect(0, 0, w, h);

  /* head: the mark, and when the record starts */
  /* the mark takes the ink the plate needs: white on the dark plate, black
     on the pale one — two real versions, chosen here */
  const mark = dark ? (art.logoLight ?? art.logo) : (art.logo ?? art.logoLight);
  if (mark) {
    const logoH = 180;
    const logoW = logoH * (mark.width / mark.height);
    ctx.drawImage(mark, 105, 78, logoW, logoH);
  }
  ctx.fillStyle = quiet;
  ctx.textAlign = 'right';
  ctx.font = '600 36px Jost, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('SINCE 2019 · UK & EUROPE', w - 110, 192);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = rule;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(105, 292);
  ctx.lineTo(w - 105, 292);
  ctx.stroke();

  /* the record */
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.font = '400 104px Anton, Impact, sans-serif';
  ctx.fillText(String(record.title ?? '').toUpperCase(), 105, 415);
  ctx.fillStyle = quiet;
  ctx.font = '600 36px Jost, sans-serif';
  ctx.letterSpacing = '7px';
  ctx.fillText(String(record.note ?? '').toUpperCase(), 105, 476);
  ctx.letterSpacing = '0px';

  const rows = record.rows ?? [];
  const top = 600;
  const step = rows.length ? Math.min(140, (1320 - top) / rows.length) : 140;
  rows.forEach((row, i) => {
    const y = top + i * step;
    ctx.fillStyle = ink;
    ctx.textAlign = 'left';
    ctx.font = '600 60px Jost, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText(String(row.label ?? '').toUpperCase(), 110, y);
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'right';
    ctx.font = '400 100px Anton, Impact, sans-serif';
    ctx.fillText(String(row.value ?? ''), w - 120, y + 10);
    ctx.strokeStyle = rule;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(110, y + 44);
    ctx.lineTo(w - 120, y + 44);
    ctx.stroke();
  });

  /* the standing line at the foot */
  ctx.fillStyle = quiet;
  ctx.textAlign = 'center';
  ctx.font = '600 31px Jost, sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('CASTING    |    TAKE 3    |    LONDON', w / 2, 1382);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

/**
 * The rear as a launch card: one mark, tinted for the plate, and the date
 * and the date beneath it. `record` carries { title, lines }; `art.mark` is the
 * loaded mark. The context is already scaled for the canvas's density.
 */
function paintRearMark(ctx, record, dark, art) {
  const { w, h } = FACE;
  const ink = dark ? '#eeece6' : '#17181c';
  ctx.fillStyle = dark ? '#15171b' : '#dcdcd6';
  ctx.fillRect(0, 0, w, h);
  /* the mark, large and a little above centre; the date beneath it */
  if (art.mark) {
    const tinted = tintMark(art.mark, dark ? '#eeeae3' : '#17181a');
    fitImage(ctx, tinted, 500, 250, 1100, 700);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = ink;
  ctx.font = '500 52px Jost, sans-serif';
  ctx.letterSpacing = '6px';
  let y = 1120;
  for (const line of record.lines ?? []) {
    ctx.fillText(String(line).toUpperCase(), w / 2, y, 1800);
    y += 84;
  }
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

/* ------------------------------------------------------------- the readout */

/* the seven segments of one digit, as the cut plates they are */
const SEGMENTS = {
  a: [[12, 3], [49, 3], [57, 10], [49, 17], [12, 17], [5, 10]],
  g: [[12, 56], [49, 56], [57, 63], [49, 70], [12, 70], [5, 63]],
  d: [[12, 109], [49, 109], [57, 116], [49, 123], [12, 123], [5, 116]],
  f: [[3, 13], [10, 20], [10, 52], [3, 59], [-4, 52], [-4, 20]],
  b: [[58, 13], [65, 20], [65, 52], [58, 59], [51, 52], [51, 20]],
  e: [[3, 67], [10, 74], [10, 106], [3, 113], [-4, 106], [-4, 74]],
  c: [[58, 67], [65, 74], [65, 106], [58, 113], [51, 106], [51, 74]],
};
const GLYPHS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];

/* Painting glowing segments with a canvas shadow is slow — fifty-six blurred
   fills per repaint, twenty-five repaints a second. So each glyph is painted
   once, with its glow, into an atlas, and a readout is eleven blits. */
const GLYPH_SCALE = 1.18;
const GLYPH_W = 83;
const GLYPH_H = 126;
const COLON_W = 28;
const ledAtlases = new Map();
function buildLedAtlas(k) {
  if (ledAtlases.has(k)) return ledAtlases.get(k);
  const unit = GLYPH_SCALE * k;
  const cellW = Math.ceil((GLYPH_W + 16) * unit);
  const cellH = Math.ceil((GLYPH_H + 16) * unit);
  const [canvas, ctx] = makeCanvas(cellW * 11, cellH);
  ctx.scale(unit, unit);
  for (let digit = 0; digit <= 9; digit++) {
    const ox = (digit * cellW) / unit + 8;
    const oy = 8;
    for (const [key, poly] of Object.entries(SEGMENTS)) {
      const on = GLYPHS[digit].includes(key);
      ctx.fillStyle = on ? '#e8321c' : '#160807';
      ctx.shadowColor = '#ff2a10';
      ctx.shadowBlur = on ? 3 : 0;
      ctx.beginPath();
      poly.forEach(([px, py], i) => (i ? ctx.lineTo(ox + px, oy + py) : ctx.moveTo(ox + px, oy + py)));
      ctx.closePath();
      ctx.fill();
    }
  }
  /* the colon, in the eleventh cell */
  const cx = (10 * cellW) / unit + 8;
  ctx.fillStyle = '#e0301a';
  ctx.shadowColor = '#ff2a10';
  ctx.shadowBlur = 3;
  for (const y of [42, 88]) {
    ctx.beginPath();
    ctx.arc(cx + 7, 8 + y, 3.3, 0, Math.PI * 2);
    ctx.fill();
  }
  const atlas = { canvas, cellW, cellH, k };
  ledAtlases.set(k, atlas);
  return atlas;
}

/** Restrained red on near-black glass; the off segments still faintly there. */
export function paintLED(ctx, text) {
  const { w, h } = LED;
  const k = fitDensity(ctx, LED);
  const atlas = buildLedAtlas(k);
  ctx.fillStyle = '#030405';
  ctx.fillRect(0, 0, w, h);
  /* eight digits and three colons are 748 units wide; centred in the window */
  const pad = 8 * GLYPH_SCALE;
  let x = (w - 748 * GLYPH_SCALE) / 2 - pad;
  const y = (h - GLYPH_H * GLYPH_SCALE) / 2 - pad;
  for (const char of text) {
    const cell = char === ':' ? 10 : Number(char);
    if (Number.isNaN(cell)) continue;
    /* the atlas is already at this density; drawn 1:1 in device pixels */
    ctx.drawImage(atlas.canvas, cell * atlas.cellW, 0, atlas.cellW, atlas.cellH, x, y, atlas.cellW / k, atlas.cellH / k);
    x += (char === ':' ? COLON_W : GLYPH_W) * GLYPH_SCALE;
  }
}

/** The fonts the face is set in. Resolves either way, so a slow font can never hold the scene up. */
export function whenFontsReady(timeoutMs = 2500) {
  if (!document.fonts?.load) return Promise.resolve();
  const wanted = Promise.all([
    document.fonts.load('400 60px Anton'),
    document.fonts.load('700 64px Caveat'),
    document.fonts.load('600 64px Caveat'),
    document.fonts.load('500 20px Jost'),
    document.fonts.load('600 31px Jost'),
  ]).catch(() => {});
  return Promise.race([wanted, new Promise((resolve) => setTimeout(resolve, timeoutMs))]);
}

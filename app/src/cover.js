// VICE HEAT cover renderer: draws the multi-panel GTA-style poster onto a canvas.
// One hero close-up up top, six smaller panels around it, a big retro-gradient title
// with chrome stripes, a pink neon script subtitle, a tagline ribbon, and a bottom
// bar with COMING SOON, billing, barcode and a gold seal. All original art.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: 'Landscape 1920 x 1080' },
};

export const GRADES = {
  sunset: {
    name: 'Sunset',
    overlayTop: 'rgba(255,122,24,0.18)',
    overlayBottom: 'rgba(255,46,136,0.34)',
    title: ['#ffd23f', '#ff7a18', '#ff2e88', '#7b2ff7'],
  },
  neon: {
    name: 'Neon',
    overlayTop: 'rgba(123,47,247,0.20)',
    overlayBottom: 'rgba(255,46,136,0.38)',
    title: ['#ffe95e', '#ff5da2', '#b44dff', '#4d7cfe'],
  },
  gold: {
    name: 'Gold',
    overlayTop: 'rgba(255,190,60,0.20)',
    overlayBottom: 'rgba(255,110,20,0.36)',
    title: ['#fff3a3', '#ffc93c', '#ff8a00', '#e14d00'],
  },
};

// The seven panels: one hero plus six around it. Each has a default sample photo,
// a zoom and a crop offset so the two samples read differently in every panel.
export const PANEL_DEFS = [
  { id: 'hero', role: 'THE DRIVER', photo: 'pier', zoom: 1.15, ox: 0, oy: -0.05 },
  { id: 'left-top', role: 'THE BOSS', photo: 'boulevard', zoom: 1.45, ox: -0.12, oy: 0 },
  { id: 'left-bottom', role: 'THE FIXER', photo: 'pier', zoom: 1.55, ox: 0.1, oy: 0.08 },
  { id: 'right-top', role: 'THE QUEEN', photo: 'pier', zoom: 1.45, ox: 0.12, oy: -0.05 },
  { id: 'right-bottom', role: 'THE LOOKOUT', photo: 'boulevard', zoom: 1.55, ox: -0.1, oy: 0.05 },
  { id: 'bottom-left', role: 'THE GETAWAY', photo: 'boulevard', zoom: 1.3, ox: 0, oy: 0.1 },
  { id: 'bottom-right', role: 'THE BRAINS', photo: 'pier', zoom: 1.3, ox: 0, oy: -0.08 },
];

export function defaultState() {
  return {
    size: '1080x1080',
    title: 'VICE HEAT',
    subtitle: 'paid in sunsets',
    tagline: 'FIVE FRIENDS \u00b7 ONE COAST \u00b7 NO WAY BACK',
    quote: 'THE HOTTEST RIDE OF THE YEAR',
    press: 'VICE HEAT GAZETTE',
    grade: 'sunset',
    panels: PANEL_DEFS.map((p) => ({ ...p })),
  };
}

// Panel and band rectangles as fractions of the canvas, so every export size
// shares one layout.
function layout(w, h) {
  const F = (x, y, pw, ph) => ({ x: x * w, y: y * h, w: pw * w, h: ph * h });
  return {
    topBar: F(0, 0, 1, 0.052),
    hero: F(0.31, 0.058, 0.38, 0.44),
    leftTop: F(0.014, 0.058, 0.282, 0.214),
    leftBottom: F(0.014, 0.284, 0.282, 0.214),
    rightTop: F(0.704, 0.058, 0.282, 0.214),
    rightBottom: F(0.704, 0.284, 0.282, 0.214),
    title: F(0, 0.505, 1, 0.105),
    subtitle: F(0, 0.612, 1, 0.05),
    tagline: F(0.08, 0.668, 0.84, 0.038),
    bottomLeft: F(0.014, 0.716, 0.48, 0.178),
    bottomRight: F(0.506, 0.716, 0.48, 0.178),
    bottomBar: F(0, 0.902, 1, 0.098),
  };
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function fitText(ctx, text, maxW, startSize, weight = 'bold') {
  let size = startSize;
  ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  while (ctx.measureText(text).width > maxW && size > 10) {
    size -= 2;
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
  }
  return size;
}

function drawPanel(ctx, rect, photo, panel, grade) {
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (photo) {
    const scale = Math.max(w / photo.naturalWidth, h / photo.naturalHeight) * panel.zoom;
    const dw = photo.naturalWidth * scale;
    const dh = photo.naturalHeight * scale;
    const dx = x + (w - dw) / 2 + panel.ox * w;
    const dy = y + (h - dh) / 2 + panel.oy * h;
    ctx.drawImage(photo, dx, dy, dw, dh);
  } else {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#3b0f4f');
    g.addColorStop(1, '#160a2e');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  // Warm sunset grade over the photo.
  const tint = ctx.createLinearGradient(x, y, x, y + h);
  tint.addColorStop(0, grade.overlayTop);
  tint.addColorStop(1, grade.overlayBottom);
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  // Vignette: darker corners so the panel reads as one photo.
  const vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // Frame.
  ctx.lineWidth = panel.id === 'hero' ? 5 : 3;
  ctx.strokeStyle = panel.id === 'hero' ? '#ffd23f' : '#0d0716';
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  // Angled role label at the panel's foot.
  const label = panel.role || '';
  if (label) {
    const fs = Math.max(12, Math.min(w * 0.085, h * 0.16));
    ctx.save();
    ctx.font = `bold ${fs}px system-ui, sans-serif`;
    const tw = ctx.measureText(label).width;
    const bw = tw + fs * 1.1;
    const bh = fs * 1.7;
    ctx.translate(x + 6, y + h - bh - 8);
    ctx.rotate(-0.07);
    ctx.fillStyle = 'rgba(10,5,18,0.92)';
    ctx.fillRect(0, 0, bw, bh);
    ctx.fillStyle = '#ff5da2';
    ctx.fillRect(0, 0, fs * 0.35, bh);
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, fs * 0.55, bh / 2 + 1);
    ctx.restore();
  }
}

function drawTitle(ctx, band, text, stops) {
  // Draw on an offscreen canvas so the chrome stripes stay inside the letters.
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.ceil(band.w));
  off.height = Math.max(2, Math.ceil(band.h));
  const o = off.getContext('2d');
  let size = band.h * 0.82;
  o.font = `900 ${size}px system-ui, sans-serif`;
  while (o.measureText(text).width > band.w * 0.96 && size > 10) {
    size -= 2;
    o.font = `900 ${size}px system-ui, sans-serif`;
  }
  // Gradient spans the text itself (not the whole band) so yellow starts at the
  // first letter and purple ends at the last one.
  const tw = o.measureText(text).width;
  const x0 = (off.width - tw) / 2;
  const grad = o.createLinearGradient(x0, 0, x0 + tw, 0);
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  o.textAlign = 'center';
  o.textBaseline = 'middle';
  o.fillStyle = grad;
  o.shadowColor = 'rgba(0,0,0,0.55)';
  o.shadowBlur = size * 0.08;
  o.shadowOffsetY = size * 0.03;
  o.fillText(text, off.width / 2, off.height / 2);
  o.shadowBlur = 0;
  o.shadowOffsetY = 0;
  // Retro chrome stripes, clipped to the letters.
  o.globalCompositeOperation = 'source-atop';
  o.fillStyle = 'rgba(255,255,255,0.4)';
  const stripeH = Math.max(2, size * 0.045);
  for (let i = 0; i < 3; i++) {
    const sy = off.height * (0.3 + i * 0.2);
    o.fillRect(0, sy, off.width, stripeH);
  }
  o.fillStyle = 'rgba(0,0,0,0.22)';
  o.fillRect(0, off.height * 0.62, off.width, stripeH);
  o.globalCompositeOperation = 'source-over';
  ctx.drawImage(off, band.x, band.y);
}

function drawBarcode(ctx, x, y, w, h) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#111111';
  let bx = x + 4;
  let seed = 7;
  while (bx < x + w - 4) {
    seed = (seed * 31 + 17) % 97;
    const bw = 2 + (seed % 4);
    if (seed % 3 !== 0) ctx.fillRect(bx, y + 3, bw, h - 6);
    bx += bw + 2;
  }
}

/** Draws the whole cover. `photos` maps a photo key to a loaded image (or null). */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const L = layout(w, h);

  // Backdrop: deep violet night with a warm glow behind the hero.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#160a2e');
  bg.addColorStop(0.5, '#3b0f4f');
  bg.addColorStop(1, '#12081f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w / 2, h * 0.28, 10, w / 2, h * 0.28, w * 0.45);
  glow.addColorStop(0, 'rgba(255,122,24,0.35)');
  glow.addColorStop(1, 'rgba(255,122,24,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Panels.
  const rects = {
    hero: L.hero,
    'left-top': L.leftTop,
    'left-bottom': L.leftBottom,
    'right-top': L.rightTop,
    'right-bottom': L.rightBottom,
    'bottom-left': L.bottomLeft,
    'bottom-right': L.bottomRight,
  };
  for (const panel of state.panels) {
    drawPanel(ctx, rects[panel.id], photos.get(panel.photo) || null, panel, grade);
  }

  // Top bar: five gold stars, press quote, publication + VOL. 1 badge.
  const tb = L.topBar;
  ctx.fillStyle = '#0d0716';
  ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
  const starR = tb.h * 0.32;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, tb.x + w * 0.02 + starR + i * starR * 2.4, tb.y + tb.h / 2, starR, '#ffd23f');
  }
  // Quote sits between the stars (left) and the press name (right): fit it to
  // the free middle band and centre it there, so it can never touch either.
  const quoteSize = fitText(ctx, state.quote, w * 0.34, tb.h * 0.42);
  ctx.font = `bold ${quoteSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`\u201c${state.quote}\u201d`, w * 0.46, tb.y + tb.h / 2 + 1);
  const pressSize = Math.max(10, tb.h * 0.34);
  ctx.font = `bold ${pressSize}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(state.press, w - w * 0.115, tb.y + tb.h / 2 + 1);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.strokeRect(w - w * 0.105, tb.y + tb.h * 0.18, w * 0.095, tb.h * 0.64);
  ctx.fillStyle = '#ffd23f';
  ctx.font = `bold ${pressSize * 0.9}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('VOL. 1', w - w * 0.0575, tb.y + tb.h / 2 + 1);
  ctx.textAlign = 'left';

  // Big retro-gradient title with chrome stripes.
  drawTitle(ctx, L.title, (state.title || 'VICE HEAT').toUpperCase(), grade.title);

  // Pink neon script subtitle.
  const sub = L.subtitle;
  const subSize = fitText(ctx, state.subtitle, w * 0.8, sub.h * 0.72, 'italic 700');
  ctx.font = `italic 700 ${subSize}px 'Segoe Script', 'Brush Script MT', cursive, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = subSize * 0.5;
  ctx.fillStyle = '#ff5da2';
  ctx.fillText(state.subtitle, w / 2, sub.y + sub.h / 2);
  ctx.shadowBlur = subSize * 0.18;
  ctx.fillStyle = '#ffd7ea';
  ctx.fillText(state.subtitle, w / 2, sub.y + sub.h / 2);
  ctx.shadowBlur = 0;

  // Tagline ribbon.
  const tg = L.tagline;
  ctx.fillStyle = 'rgba(13,7,22,0.95)';
  ctx.fillRect(tg.x, tg.y, tg.w, tg.h);
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = 2;
  ctx.strokeRect(tg.x, tg.y, tg.w, tg.h);
  const tgSize = fitText(ctx, state.tagline, tg.w * 0.94, tg.h * 0.55);
  ctx.font = `bold ${tgSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline, w / 2, tg.y + tg.h / 2 + 1);

  // Bottom bar: COMING SOON, billing block, barcode, gold seal.
  const bb = L.bottomBar;
  ctx.fillStyle = '#0d0716';
  ctx.fillRect(bb.x, bb.y, bb.w, bb.h);
  const csSize = fitText(ctx, 'COMING SOON', w * 0.2, bb.h * 0.42);
  ctx.font = `900 ${csSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COMING SOON', w * 0.02, bb.y + bb.h / 2 + 1);
  ctx.font = `${Math.max(9, bb.h * 0.13)}px system-ui, sans-serif`;
  ctx.fillStyle = '#9a93a8';
  ctx.textAlign = 'center';
  ctx.fillText('VICE HEAT STUDIO  \u00b7  A COVER MADE WITH YOUR OWN PHOTOS', w * 0.45, bb.y + bb.h * 0.32);
  ctx.fillText('NO ROCKSTAR ARTWORK  \u00b7  ORIGINAL COVER ART  \u00b7  1080 \u00b7 1350 \u00b7 1920', w * 0.45, bb.y + bb.h * 0.68);
  const bw = w * 0.11;
  const bh = bb.h * 0.62;
  drawBarcode(ctx, w * 0.79, bb.y + (bb.h - bh) / 2, bw, bh);
  // Gold seal.
  const sr = bb.h * 0.42;
  const sx = w * 0.945;
  const sy = bb.y + bb.h / 2;
  const seal = ctx.createRadialGradient(sx - sr * 0.3, sy - sr * 0.3, sr * 0.1, sx, sy, sr);
  seal.addColorStop(0, '#ffe95e');
  seal.addColorStop(1, '#c9920e');
  ctx.fillStyle = seal;
  ctx.beginPath();
  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7a5b00';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawStar(ctx, sx, sy - sr * 0.18, sr * 0.32, '#7a5b00');
  ctx.fillStyle = '#3a2c00';
  ctx.font = `bold ${Math.max(8, sr * 0.24)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('ORIGINAL', sx, sy + sr * 0.32);
  ctx.fillText('COVER ART', sx, sy + sr * 0.58);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

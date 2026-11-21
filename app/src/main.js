// VICE HEAT Cover Studio: wires the editor. Pick photos (samples or your own
// uploads), crop and position each of the seven panels, edit the title, subtitle,
// tagline and quote, pick a grade and an export size, then export a real PNG.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, SIZES, GRADES, PANEL_DEFS } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const state = defaultState();

// Loaded images by key: 'pier' and 'boulevard' are the bundled samples, 'up0',
// 'up1', ... are the user's own uploads (read on this machine, never sent).
const photos = new Map();
let uploadCount = 0;

function redraw() {
  drawCover(canvas, state, photos);
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  const [pier, boulevard] = await Promise.all([
    loadImage('samples/pier.jpg'),
    loadImage('samples/boulevard.jpg'),
  ]);
  photos.set('pier', pier);
  photos.set('boulevard', boulevard);
  refreshPhotoOptions();
  redraw();
}

function photoLabel(key) {
  if (key === 'pier') return 'Pier (sample)';
  if (key === 'boulevard') return 'Boulevard (sample)';
  return `Upload ${Number(key.slice(2)) + 1}`;
}

function refreshPhotoOptions() {
  document.querySelectorAll('.panel-photo').forEach((select) => {
    const current = select.value;
    select.innerHTML = '';
    for (const key of photos.keys()) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = photoLabel(key);
      select.appendChild(opt);
    }
    if (photos.has(current)) select.value = current;
  });
}

function buildPanelEditors() {
  const host = document.getElementById('panels');
  state.panels.forEach((panel, i) => {
    const def = PANEL_DEFS[i];
    const card = document.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <div class="panel-head"><span class="panel-name">${def.id.toUpperCase()}</span></div>
      <label>Photo <select class="panel-photo" data-i="${i}"></select></label>
      <label>Role <input class="panel-role" data-i="${i}" type="text" maxlength="16" value="${panel.role}"></label>
      <label>Zoom <input class="panel-zoom" data-i="${i}" type="range" min="0.8" max="2.5" step="0.05" value="${panel.zoom}"></label>
      <label>Left / right <input class="panel-ox" data-i="${i}" type="range" min="-0.3" max="0.3" step="0.01" value="${panel.ox}"></label>
      <label>Up / down <input class="panel-oy" data-i="${i}" type="range" min="-0.3" max="0.3" step="0.01" value="${panel.oy}"></label>`;
    host.appendChild(card);
  });
  host.addEventListener('input', (e) => {
    const t = e.target;
    const i = Number(t.dataset.i);
    if (Number.isNaN(i)) return;
    const panel = state.panels[i];
    if (t.classList.contains('panel-photo')) panel.photo = t.value;
    if (t.classList.contains('panel-role')) panel.role = t.value.toUpperCase();
    if (t.classList.contains('panel-zoom')) panel.zoom = Number(t.value);
    if (t.classList.contains('panel-ox')) panel.ox = Number(t.value);
    if (t.classList.contains('panel-oy')) panel.oy = Number(t.value);
    redraw();
  });
}

function bindText(id, key, upper = false) {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    state[key] = upper ? el.value.toUpperCase() : el.value;
    redraw();
  });
}

function bindSizeButtons() {
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      const { w, h } = SIZES[state.size];
      canvas.width = w;
      canvas.height = h;
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
      document.getElementById('export').textContent = `Export PNG ${w} x ${h}`;
      redraw();
    });
  });
}

function bindGradeButtons() {
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.grade = btn.dataset.grade;
      document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
      redraw();
    });
  });
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  for (const file of files) {
    const key = `up${uploadCount++}`;
    photos.set(key, await loadImage(URL.createObjectURL(file)));
  }
  if (files.length) {
    // The first upload fills the hero panel right away.
    state.panels[0].photo = `up${uploadCount - files.length}`;
    refreshPhotoOptions();
    redraw();
    status.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} loaded — hero panel updated.`;
  }
});

document.getElementById('export').addEventListener('click', () => {
  const { w, h } = SIZES[state.size];
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-heat-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved vice-heat-${w}x${h}.png`;
  }, 'image/png');
});

bindText('title', 'title', true);
bindText('subtitle', 'subtitle');
bindText('tagline', 'tagline', true);
bindText('quote', 'quote', true);
bindSizeButtons();
bindGradeButtons();
buildPanelEditors();

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    state,
    photos,
    loadImage,
    loadSamples,
    refreshPhotoOptions,
    redraw,
    setSize(key) {
      state.size = key;
      const { w, h } = SIZES[key];
      canvas.width = w;
      canvas.height = h;
    },
  });
} else {
  loadSamples();
}

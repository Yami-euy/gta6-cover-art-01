// Fixed scenes for screenshots: ?shot=cover shows the cover alone at the size the
// query asks for, ?shot=editor shows the page with a sample photo loaded, and
// ?shot=portrait shows the 1080 x 1350 cover. window.__shotReady is set once painted.
export async function runShot(shot, query, app) {
  const size = query.get('size') || (shot === 'portrait' ? '1080x1350' : '1080x1080');
  const grade = query.get('grade') || 'sunset';
  app.state.grade = grade;
  app.setSize(size);
  await app.loadSamples();
  if (shot === 'cover' || shot === 'portrait') {
    document.body.classList.add('shot-cover');
  }
  if (query.get('title')) app.state.title = query.get('title');
  app.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

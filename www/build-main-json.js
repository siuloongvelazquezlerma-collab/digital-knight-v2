// ============================================================
// 📦 build-main-json.js
// Genera main-data.json a partir de main.html
// Separa imágenes + enlaces por PESTAÑA y por SECCIÓN (<h2>).
// Se ejecuta:  node build-main-json.js
// ============================================================
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const html = fs.readFileSync(path.join(DIR, 'main.html'), 'utf8');
const lines = html.split(/\r?\n/);

// ---------- 1) Localizar límites de cada pestaña ----------
const tabTags = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/data-section="([a-z-]+)"/);
  if (m) tabTags.push({ name: m[1], startLine: i + 1 });
}
const tabRanges = {};
for (let t = 0; t < tabTags.length; t++) {
  const cur = tabTags[t];
  const nextStart = t + 1 < tabTags.length ? tabTags[t + 1].startLine : (lines.length + 1);
  tabRanges[cur.name] = { start: cur.startLine - 1, end: nextStart - 1 };
}

// ---------- 2) Definiciones mínimas ----------
// (la extracción de ítems se hace en collectItems())

function collectItems(region) {
  const items = [];
  const usedRanges = [];

  // Tarjetas TOP 10 (con rank-number). <a href>…<img>…</a>
  const cardAnchorRe = /<div class="card">\s*<span class="rank-number">\s*([^<]+?)\s*<\/span>[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/g;
  // Ítems genéricos <a href>…</a>
  const genericAnchorRe = /<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/g;

  // Extrae atributos del <img> dentro del chunk (no se rompe por el ">" del SVG placeholder)
  function imgAttrs(chunk) {
    const img = chunk.slice(chunk.search(/<img\b/i));
    const dataSrc = (img.match(/data-src="([^"]*)"/) || [])[1];
    const src = (img.match(/\bsrc="([^"]*)"/) || [])[1];
    const alt = (img.match(/alt="([^"]*)"/) || [])[1];
    return { image: (dataSrc || src || '').trim(), alt: (alt || '').trim() };
  }

  let cm;
  cardAnchorRe.lastIndex = 0;
  while ((cm = cardAnchorRe.exec(region)) !== null) {
    if (!/<img\b/i.test(cm[0])) continue;
    const a = imgAttrs(cm[0]);
    items.push({ rank: cm[1].trim(), link: cm[2], image: a.image, alt: a.alt });
    usedRanges.push([cm.index, cardAnchorRe.lastIndex]);
  }

  let im;
  genericAnchorRe.lastIndex = 0;
  while ((im = genericAnchorRe.exec(region)) !== null) {
    if (!/<img\b/i.test(im[0])) continue;
    const overlapped = usedRanges.some(([s, e]) => im.index >= s && im.index < e);
    if (overlapped) continue;
    const a = imgAttrs(im[0]);
    items.push({ rank: '', link: im[1], image: a.image, alt: a.alt });
    usedRanges.push([im.index, genericAnchorRe.lastIndex]);
  }
  return items;
}

function detectContainer(region) {
  if (/class="[\s\S]*?top-10"/.test(region)) return 'top10';
  if (/upcoming-scroll/.test(region)) return 'upcoming';
  if (/mexicanas-scroll-container/.test(region)) return 'mexicanas';
  if (/horizontal-scroll-container/.test(region)) return 'horizontal';
  if (/scroll-container/.test(region)) return 'scroll';
  return 'scroll';
}

// ---------- 3) Separar en secciones por <h2> ----------
function splitSections(region) {
  const sections = [];
  // Posiciones + títulos de los <h2>
  const h2s = [];
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
  let hm;
  h2Re.lastIndex = 0;
  while ((hm = h2Re.exec(region)) !== null) {
    const title = hm[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    h2s.push({ title, start: hm.index, end: h2Re.lastIndex });
  }

  if (h2s.length === 0) {
    const items = collectItems(region);
    if (items.length) sections.push({ title: 'Sección', container: detectContainer(region), items });
    return sections;
  }

  // Contenido antes del primer <h2> (si lo hubiera)
  const preamble = region.slice(0, h2s[0].start);
  {
    const items = collectItems(preamble);
    if (items.length) sections.push({ title: 'Sin título', container: detectContainer(preamble), items });
  }

  for (let s = 0; s < h2s.length; s++) {
    const chunkStart = h2s[s].end; // después del cierre de este <h2>
    // Límite superior: la sección siguiente vuelve a buscar su propio título en
    // su <h2>, por lo que no hay que cruzarlo. Siempre cortamos en el <h2> siguiente.
    const chunkEnd = s + 1 < h2s.length ? h2s[s + 1].start : region.length;
    const title = h2s[s].title || ('Sección ' + (s + 1));

    // Sección de "Continuar Viendo": se llena dinámicamente, se omite del JSON.
    if (/continuar viendo/i.test(title)) continue;

    const chunk = region.slice(chunkStart, chunkEnd);
    const items = collectItems(chunk);
    if (items.length) {
      sections.push({ title, container: detectContainer(chunk), items });
    }
  }
  return sections;
}

// ---------- 4) Construcción final ----------
const out = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'main.html',
  tabs: {}
};

for (const name of Object.keys(tabRanges)) {
  const { start, end } = tabRanges[name];
  const region = lines.slice(start, end).join('\n');
  const sections = splitSections(region);
  if (sections.length) out.tabs[name] = { sections };
}

const jsonFile = path.join(DIR, 'main-data.json');
fs.writeFileSync(jsonFile, JSON.stringify(out, null, 2), 'utf8');

// Estadísticas
let total = 0;
let secs = 0;
for (const t of Object.keys(out.tabs)) {
  for (const s of out.tabs[t].sections) {
    total += s.items.length;
    secs++;
  }
}
console.log('✅ main-data.json creado');
console.log('Pestañas:', Object.keys(out.tabs).join(', '));
console.log('Secciones:', secs, '| Ítems totales:', total);
export const APPARATUS_LIST = ['VOLTEGGIO', 'PARALLELE', 'TRAVE', 'CORPO LIBERO'];

export function getPodioLabel(n, mode) {
  if (mode === 'fasce') {
    if (n === 1) return 'FASCIA ORO';
    if (n === 2) return 'FASCIA ARGENTO';
    return 'FASCIA BRONZO';
  }
  if (mode === 'classificato') return `${n}° CLASSIFICATO`;
  return `${n}° CLASSIFICATA`;
}

export function formatTitle(str) {
  if (!str) return '';
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function newCategory(overrides = {}) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    name: 'Nuova Categoria',
    coppe: 3,
    medals: 5,
    diameterMm: 40,
    winnersPerPosition: 1,
    hasApparatus: false,
    apparatus: APPARATUS_LIST.map(name => ({ name, qty: 3, enabled: true })),
    ...overrides
  };
}

// Generate all label descriptors for a given config
export function generateAllLabels(config) {
  const { eventName, locationDate, podioMode, hasParticipation, participationCount = 1, categories } = config;
  const labels = [];

  if (hasParticipation) {
    const pCount = Math.max(1, parseInt(participationCount) || 1);
    for (let i = 0; i < pCount; i++) {
      labels.push({
        type: 'medal-front',
        group: 'partecipazione',
        topText: eventName,
        bottomText: locationDate,
        diameterMm: 25,
        tag: 'PARTECIPAZIONE Ø 25mm'
      });
    }
  }

  categories.forEach(cat => {
    const qty = Math.max(1, parseInt(cat.winnersPerPosition) || 1);

    // Rectangular labels (trophies)
    for (let i = 1; i <= (cat.coppe || 0); i++) {
      const widthCm = 9.0;
      for (let q = 0; q < qty; q++) {
        labels.push({
          type: 'rect',
          group: 'coppe',
          competitionName: eventName,
          category: cat.name,
          position: getPodioLabel(i, podioMode),
          locationDate,
          widthCm,
          posNum: i,
          tag: `COPPA ${widthCm}cm – ${cat.name}`
        });
      }
    }

    // Podio medals
    for (let i = 1; i <= (cat.medals || 0); i++) {
      // Front medal (only for Ø70mm; smaller sizes share the participation front)
      if (cat.diameterMm === 70) {
        for (let q = 0; q < qty; q++) {
          labels.push({
            type: 'medal-front',
            group: 'medaglie',
            topText: eventName,
            bottomText: locationDate,
            diameterMm: cat.diameterMm,
            tag: `FRONTE Ø${cat.diameterMm}mm – ${cat.name}`
          });
        }
      }
      for (let q = 0; q < qty; q++) {
        labels.push({
          type: 'medal-back',
          group: 'medaglie',
          category: cat.name,
          subCategory: '',
          position: getPodioLabel(i, podioMode),
          locationDate,
          diameterMm: cat.diameterMm,
          posNum: i,
          tag: `RETRO Ø${cat.diameterMm}mm – ${cat.name}${cat.diameterMm !== 70 ? ' (fronte: Ø25mm)' : ''}`
        });
      }
    }

    // Apparatus medals
    if (cat.hasApparatus && Array.isArray(cat.apparatus)) {
      cat.apparatus.filter(a => a.enabled).forEach(app => {
        const appQty = Math.max(1, parseInt(app.qty) || 3);
        for (let j = 1; j <= appQty; j++) {
          const winnersQty = Math.max(1, qty);
          if (cat.diameterMm === 70) {
            for (let q = 0; q < winnersQty; q++) {
              labels.push({
                type: 'medal-front',
                group: 'medaglie',
                topText: eventName,
                bottomText: locationDate,
                diameterMm: cat.diameterMm,
                tag: `FRONTE Ø${cat.diameterMm}mm – ${cat.name} ${app.name}`
              });
            }
          }
          for (let q = 0; q < winnersQty; q++) {
            labels.push({
              type: 'medal-back',
              group: 'medaglie',
              category: cat.name,
              subCategory: app.name,
              position: getPodioLabel(j, podioMode),
              locationDate,
              diameterMm: cat.diameterMm,
              posNum: j,
              tag: `RETRO Ø${cat.diameterMm}mm – ${cat.name} ${app.name}`
            });
          }
        }
      });
    }
  });

  return labels;
}

// Build SVG sheet string from all SVGs inside a container
export function buildSheetSvgString(containerEl, sheetW = 297) {
  const svgs = Array.from(containerEl.querySelectorAll('svg'));
  if (svgs.length === 0) return '';

  const SPACING = 5;
  let x = SPACING, y = SPACING, rowH = 0, totalH = SPACING;
  const positions = [];

  svgs.forEach(svg => {
    const w = parseFloat(svg.getAttribute('width') || '40');
    const h = parseFloat(svg.getAttribute('height') || '40');
    if (x + w > sheetW - SPACING) {
      x = SPACING;
      y += rowH + SPACING;
      rowH = 0;
    }
    positions.push({ x, y, w, h, svg });
    x += w + SPACING;
    rowH = Math.max(rowH, h);
    totalH = y + rowH + SPACING;
  });

  const ns = 'http://www.w3.org/2000/svg';
  const serial = new XMLSerializer();

  let out = `<svg xmlns="${ns}" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}mm" height="${totalH}mm" viewBox="0 0 ${sheetW} ${totalH}">\n`;
  positions.forEach(({ x, y, w, h, svg }) => {
    const vb = svg.getAttribute('viewBox') || `0 0 ${w} ${h}`;
    out += `  <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}">\n`;
    svg.childNodes.forEach(n => { out += '    ' + serial.serializeToString(n) + '\n'; });
    out += `  </svg>\n`;
  });
  out += '</svg>';
  return out;
}

// Download the preview container as SVG sheet
export function downloadSvgSheet(containerEl, filename = 'etichette.svg', sheetW = 297) {
  const out = buildSheetSvgString(containerEl, sheetW);
  if (!out) return;
  const blob = new Blob([out], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Open print dialog with correct @page size for PDF export
export function printAsPdf(containerEl, sheetW = 297) {
  const svgStr = buildSheetSvgString(containerEl, sheetW);
  if (!svgStr) return;
  const hMatch = svgStr.match(/height="([\d.]+)mm"/);
  const totalH = hMatch ? parseFloat(hMatch[1]) : 420;
  const win = window.open('', '_blank');
  if (!win) { alert('Popup blocked – please allow popups for this site'); return; }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  @page { size: ${sheetW}mm ${totalH}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  svg { display: block; }
</style></head><body>${svgStr}</body></html>`);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}

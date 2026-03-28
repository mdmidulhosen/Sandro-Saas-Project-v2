export const CUT_COLOR = "#e6007e";

export const PODIUM_PRESETS = {
  numeric: (rank) => `${rank}°`,
  class: (rank) => `${rank}° CLASS.`,
  classified: (rank) => `${rank}° CLASSIFIED`,
  classified_f: (rank) => `${rank}° CLASSIFIED`,
  classificata: (rank) => `${rank}°CLASSIFICATA`,
  classificato: (rank) => `${rank}°CLASSIFICATO`,
};

export const TROPHY_SIZE_PRESETS = [
  { rank: 1, label: "1° CLASS. - 5.5x2.3 cm", widthCm: 5.5, heightCm: 2.3 },
  { rank: 2, label: "2° CLASS. - 5.0x2.3 cm", widthCm: 5.0, heightCm: 2.3 },
  { rank: 3, label: "3° CLASS. - 4.5x2.3 cm", widthCm: 4.5, heightCm: 2.3 },
];

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeLines(lines, limit = 3) {
  return (Array.isArray(lines) ? lines : [])
    .map(normalizeText)
    .filter(Boolean)
    .slice(0, limit);
}

export function getPodiumText(rank, category, globalPreset = "class") {
  const explicit = normalizeText(category.podiumTextByRank?.[rank]);
  if (explicit) return explicit;
  const custom = normalizeText(category.podiumText);
  if (custom) return custom;
  const preset = PODIUM_PRESETS[category.podiumPreset || globalPreset];
  return preset ? preset(rank) : `${rank}°`;
}

function getTrophyPreset(rank, category, config) {
  const preset =
    TROPHY_SIZE_PRESETS.find((item) => item.rank === rank) ||
    TROPHY_SIZE_PRESETS[TROPHY_SIZE_PRESETS.length - 1];

  return {
    widthCm:
      Number(category.trophyWidthCmByRank?.[rank]) ||
      Number(config.trophyWidthCmByRank?.[rank]) ||
      preset.widthCm,
    heightCm:
      Number(category.trophyHeightCmByRank?.[rank]) ||
      Number(config.trophyHeightCmByRank?.[rank]) ||
      preset.heightCm,
    label: preset.label,
  };
}

export function newCategory(overrides = {}) {
  return {
    id: uid(),
    reference: "NEW CATEGORY",
    rowA: "",
    rowB: "",
    rowC: "",
    medals: 3,
    coppe: 3,
    copiesPerRank: 1,
    podiumPreset: "class",
    podiumText: "",
    podiumTextByRank: { 1: "", 2: "", 3: "" },
    hideCategoryMedal: false,
    hideCategoryTitle: false,
    hideCategoryDate: false,
    hideTrophyTitle: false,
    trophyAlignment: "center",
    trophyLogoAlignment: "left",
    trophyWidthCmByRank: {},
    trophyHeightCmByRank: {},
    hasApparatus: false,
    apparatus: [],
    medalDiameterMm: 40,
    ...overrides,
  };
}

function upgradeLegacyCategory(category = {}, globalPreset = "class") {
  return newCategory({
    id: category.id || uid(),
    reference: category.reference || category.name || "CATEGORY",
    rowA: category.rowA || category.name || "",
    rowB: category.rowB || "",
    rowC: category.rowC || "",
    medals: Number.isFinite(category.medals) ? category.medals : 3,
    coppe: Number.isFinite(category.coppe) ? category.coppe : 3,
    copiesPerRank: Number.isFinite(category.winnersPerPosition)
      ? category.winnersPerPosition
      : Number.isFinite(category.copiesPerRank)
        ? category.copiesPerRank
        : 1,
    podiumPreset: category.podiumPreset || category.podioMode || globalPreset,
    podiumText: category.podiumText || "",
    podiumTextByRank: category.podiumTextByRank || category.customPodioTexts || { 1: "", 2: "", 3: "" },
    hideCategoryMedal: category.hideCategoryMedal === true,
    hideCategoryTitle: category.hideCategoryTitle === true,
    hideCategoryDate: category.hideCategoryDate === true,
    hideTrophyTitle: category.hideTrophyTitle === true,
    trophyAlignment: category.trophyAlignment || "center",
    trophyLogoAlignment: category.trophyLogoAlignment || "left",
    trophyWidthCmByRank: category.trophyWidthCmByRank || {},
    trophyHeightCmByRank: category.trophyHeightCmByRank || {},
    hasApparatus: category.hasApparatus === true,
    apparatus: Array.isArray(category.apparatus) ? category.apparatus : [],
    medalDiameterMm: Number(category.diameterMm) || Number(category.medalDiameterMm) || 40,
  });
}

export function normalizeTemplate(config = {}) {
  const globalPreset = config.podiumPreset || config.podioMode || "class";
  const categories = Array.isArray(config.categories)
    ? config.categories.map((cat) => upgradeLegacyCategory(cat, globalPreset))
    : [newCategory({ podiumPreset: globalPreset })];

  return {
    raceTitleRow1: normalizeText(config.raceTitleRow1 || config.eventName),
    raceTitleRow2: normalizeText(config.raceTitleRow2),
    locationDate: normalizeText(config.locationDate),
    participationLogoSrc: config.participationLogoSrc || config.logoSrc || "",
    trophyLogoSrc: config.trophyLogoSrc || "",
    participationCount: Math.max(0, parseInt(config.participationCount, 10) || 0),
    podiumPreset: globalPreset,
    categoryBreakField: config.categoryBreakField || "rowA",
    trophyBreakField: config.trophyBreakField || "rowA",
    breakGapMm: Math.max(0, parseFloat(config.breakGapMm) || 20),
    categories,
  };
}

function getBreakValue(category, field) {
  if (!field) return "";
  if (field === "rowA") return normalizeText(category.rowA);
  if (field === "rowB") return normalizeText(category.rowB);
  if (field === "rowC") return normalizeText(category.rowC);
  return "";
}

export function generateAllLabels(rawConfig) {
  const config = normalizeTemplate(rawConfig);
  const labels = [];

  for (let index = 0; index < config.participationCount; index += 1) {
    labels.push({
      id: uid(),
      type: "participation-medal",
      group: "participation",
      raceTitleRow1: config.raceTitleRow1,
      raceTitleRow2: config.raceTitleRow2,
      locationDate: config.locationDate,
      logoSrc: config.participationLogoSrc,
      tag: `Participation ${index + 1}`,
    });
  }

  config.categories.forEach((category) => {
    const categoryLines = normalizeLines([category.rowA, category.rowB, category.rowC], 3);
    const trophyLines = normalizeLines([category.rowA, category.rowB], 2);
    const copiesPerRank = Math.max(1, parseInt(category.copiesPerRank, 10) || 1);

    if (!category.hideCategoryMedal) {
      // Regular category medals (overall ranking)
      for (let rank = 1; rank <= Math.max(0, category.medals || 0); rank += 1) {
        for (let copy = 0; copy < copiesPerRank; copy += 1) {
          labels.push({
            id: uid(),
            type: "category-medal",
            group: "category-medals",
            raceTitleRow1: config.raceTitleRow1,
            raceTitleRow2: config.raceTitleRow2,
            locationDate: config.locationDate,
            hideTitle: category.hideCategoryTitle,
            hideDate: category.hideCategoryDate,
            categoryLines,
            podiumText: getPodiumText(rank, category, config.podiumPreset),
            breakValue: getBreakValue(category, config.categoryBreakField),
            reference: category.reference,
            tag: `${category.rowA || category.reference} - medal ${rank}`,
          });
        }
      }

      // Apparatus medals (per discipline)
      if (category.hasApparatus && Array.isArray(category.apparatus)) {
        category.apparatus
          .filter((app) => app.enabled && app.name)
          .forEach((app) => {
            const appQty = Math.max(0, parseInt(app.qty, 10) || 0);
            const appName = String(app.name).trim();
            if (!appQty || !appName) return;
            for (let rank = 1; rank <= appQty; rank += 1) {
              for (let copy = 0; copy < copiesPerRank; copy += 1) {
                labels.push({
                  id: uid(),
                  type: "category-medal",
                  group: "category-medals",
                  raceTitleRow1: config.raceTitleRow1,
                  raceTitleRow2: config.raceTitleRow2,
                  locationDate: config.locationDate,
                  hideTitle: category.hideCategoryTitle,
                  hideDate: category.hideCategoryDate,
                  categoryLines: normalizeLines([category.rowA, category.rowB, appName], 3),
                  podiumText: getPodiumText(rank, category, config.podiumPreset),
                  breakValue: getBreakValue(category, config.categoryBreakField),
                  reference: category.reference,
                  tag: `${category.rowA || category.reference} - ${appName} ${rank}°`,
                });
              }
            }
          });
      }
    }

    for (let rank = 1; rank <= Math.max(0, category.coppe || 0); rank += 1) {
      const preset = getTrophyPreset(rank, category, config);
      for (let copy = 0; copy < copiesPerRank; copy += 1) {
        labels.push({
          id: uid(),
          type: "trophy",
          group: "trophies",
          raceTitleRow1: config.raceTitleRow1,
          raceTitleRow2: config.raceTitleRow2,
          locationDate: config.locationDate,
          titleHidden: category.hideTrophyTitle,
          categoryLines: trophyLines,
          podiumText: getPodiumText(rank, category, config.podiumPreset),
          logoSrc: config.trophyLogoSrc,
          align: category.trophyAlignment || "center",
          logoAlign: category.trophyLogoAlignment || "left",
          widthCm: preset.widthCm,
          heightCm: preset.heightCm,
          breakValue: getBreakValue(category, config.trophyBreakField),
          reference: category.reference,
          tag: `${category.rowA || category.reference} - trophy ${rank}`,
        });
      }
    }
  });

  return labels;
}

export function buildSheetSvgString(
  containerEl,
  sheetW = 297,
  spacingMm = 5,
  options = {},
) {
  const wrappers = Array.from(containerEl.querySelectorAll("[data-export-item='true']"));
  if (wrappers.length === 0) return "";

  const positions = [];
  let x = spacingMm;
  let y = spacingMm;
  let rowH = 0;
  let totalH = spacingMm;
  const lastBreakByGroup = {};
  const extraGap = Math.max(0, parseFloat(options.breakGapMm) || 20);

  wrappers.forEach((wrapper) => {
    const svg = wrapper.querySelector("svg");
    if (!svg) return;

    const width = parseFloat(svg.getAttribute("width") || "40");
    const height = parseFloat(svg.getAttribute("height") || "40");
    const group = wrapper.getAttribute("data-break-group") || "";
    const breakValue = wrapper.getAttribute("data-break-value") || "";

    // When break group changes, force a new row with extra vertical gap
    const breakOccurred =
      group &&
      breakValue &&
      lastBreakByGroup[group] &&
      lastBreakByGroup[group] !== breakValue;

    if (breakOccurred || x + width > sheetW - spacingMm) {
      const gapToAdd = breakOccurred ? spacingMm + extraGap : spacingMm;
      x = spacingMm;
      y += rowH + gapToAdd;
      rowH = 0;
    }

    positions.push({ x, y, width, height, svg, id: wrapper.getAttribute("data-label-id") || uid() });
    x += width + spacingMm;
    rowH = Math.max(rowH, height);
    totalH = Math.max(totalH, y + rowH + spacingMm);

    if (group && breakValue) {
      lastBreakByGroup[group] = breakValue;
    }
  });

  const serializer = new XMLSerializer();

  // Collect all defs and sticker content separately for clean export
  let allDefs = "";
  const stickers = positions.map(({ x, y, width, height, svg, id }) => {
    const viewBox = svg.getAttribute("viewBox") || `0 0 ${width} ${height}`;
    const vbParts = viewBox.split(/\s+/);
    const vbW = parseFloat(vbParts[2]) || width;
    const vbH = parseFloat(vbParts[3]) || height;
    const sx = +(width / vbW).toFixed(6);
    const sy = +(height / vbH).toFixed(6);

    let inner = "";
    svg.childNodes.forEach((child) => {
      if (child.nodeName === "defs" || child.localName === "defs") {
        // Hoist defs to top-level so textPath href resolution works across all renderers
        Array.from(child.childNodes).forEach((defChild) => {
          allDefs += serializer.serializeToString(defChild).replace(/ xmlns="[^"]*"/g, "") + "\n";
        });
      } else {
        inner += serializer.serializeToString(child).replace(/ xmlns="[^"]*"/g, "") + "\n";
      }
    });

    // Use g + transform instead of nested svg to avoid textPath scoping issues in PDF
    return `  <g id="sticker-${id}" transform="translate(${x},${y}) scale(${sx},${sy})">\n${inner}  </g>`;
  });

  let output = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${sheetW}mm" height="${totalH}mm" viewBox="0 0 ${sheetW} ${totalH}">\n`;
  if (allDefs) {
    output += `  <defs>\n${allDefs}  </defs>\n`;
  }
  output += stickers.join("\n");
  output += "\n</svg>";

  // Ensure textPath uses xlink:href for maximum PDF/print compatibility
  output = output.replace(/(<textPath[^>]*)\bhref="/g, '$1xlink:href="');

  return output;
}

export function downloadSvgSheet(
  containerEl,
  filename = "stickers.svg",
  sheetW = 297,
  spacingMm = 5,
  options = {},
) {
  const svgString = buildSheetSvgString(containerEl, sheetW, spacingMm, options);
  if (!svgString) return;
  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printAsPdf(containerEl, sheetW = 297, spacingMm = 5, options = {}) {
  const svgString = buildSheetSvgString(containerEl, sheetW, spacingMm, options);
  if (!svgString) return;

  const heightMatch = svgString.match(/height="([\d.]+)mm"/);
  const height = heightMatch ? parseFloat(heightMatch[1]) : 420;
  const popup = window.open("", "_blank");
  if (!popup) return;

  popup.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @page { size: ${sheetW}mm ${height}mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    svg { display: block; }
  </style></head><body>${svgString}</body></html>`);
  popup.document.close();
  popup.onload = () => {
    popup.focus();
    popup.print();
  };
}

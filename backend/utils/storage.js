const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const DATA_DIR = process.env.VERCEL ? "/tmp" : path.join(__dirname, "../data");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultCategory(overrides = {}) {
  return {
    id: uuidv4(),
    reference: "CATEGORY",
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
    ...overrides,
  };
}

function normalizeCategory(category = {}) {
  return defaultCategory({
    ...category,
    id: category.id || uuidv4(),
    reference: category.reference || category.name || "CATEGORY",
    rowA: category.rowA || category.name || "",
    rowB: category.rowB || "",
    rowC: category.rowC || "",
    medals: Number.isFinite(category.medals) ? category.medals : 3,
    coppe: Number.isFinite(category.coppe) ? category.coppe : 3,
    copiesPerRank: Number.isFinite(category.copiesPerRank)
      ? category.copiesPerRank
      : Number.isFinite(category.winnersPerPosition)
        ? category.winnersPerPosition
        : 1,
    podiumTextByRank: category.podiumTextByRank || category.customPodioTexts || { 1: "", 2: "", 3: "" },
    hideCategoryTitle: category.hideCategoryTitle === true,
    trophyWidthCmByRank: category.trophyWidthCmByRank || {},
    trophyHeightCmByRank: category.trophyHeightCmByRank || {},
  });
}

function normalizeTemplate(template = {}) {
  return {
    ...template,
    id: template.id || uuidv4(),
    name: template.name || "Untitled template",
    description: template.description || "",
    raceTitleRow1: template.raceTitleRow1 || template.eventName || "",
    raceTitleRow2: template.raceTitleRow2 || "",
    locationDate: template.locationDate || "",
    participationLogoSrc: template.participationLogoSrc || template.logoSrc || "",
    trophyLogoSrc: template.trophyLogoSrc || "",
    participationCount: Number.isFinite(template.participationCount)
      ? template.participationCount
      : template.hasParticipation
        ? 1
        : 0,
    podiumPreset: template.podiumPreset || template.podioMode || "class",
    categoryBreakField: template.categoryBreakField || "rowA",
    trophyBreakField: template.trophyBreakField || "rowA",
    breakGapMm: Number.isFinite(template.breakGapMm) ? template.breakGapMm : 20,
    categories: Array.isArray(template.categories)
      ? template.categories.map(normalizeCategory)
      : [defaultCategory()],
  };
}

function getDefaultTemplates() {
  const now = new Date().toISOString();

  return [
    normalizeTemplate({
      name: "Participation + Category Medals",
      description: "25mm participation medals and 40mm category medals",
      raceTitleRow1: "SPRING RACE",
      locationDate: "PISA, 22 FEB 2026",
      participationCount: 50,
      categories: [
        {
          reference: "BEGINNERS",
          rowA: "BEGINNERS",
          rowB: "WOMEN",
          medals: 3,
          coppe: 0,
        },
      ],
      created_at: now,
    }),
    normalizeTemplate({
      name: "Trophies",
      description: "Standard trophy stickers for first three ranks",
      raceTitleRow1: "CITY RUN",
      locationDate: "LUCCA, 15 MAY 2026",
      participationCount: 0,
      categories: [
        {
          reference: "OPEN MEN",
          rowA: "OPEN",
          rowB: "MEN",
          medals: 0,
          coppe: 3,
        },
      ],
      created_at: now,
    }),
  ];
}

function readTemplates() {
  ensureDataDir();
  if (!fs.existsSync(TEMPLATES_FILE)) {
    const defaults = getDefaultTemplates();
    writeTemplates(defaults);
    return defaults;
  }

  try {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf8")).map(normalizeTemplate);
  } catch {
    return [];
  }
}

function writeTemplates(templates) {
  ensureDataDir();
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), "utf8");
}

module.exports = {
  getAll: () => readTemplates(),

  getById: (id) => readTemplates().find((template) => template.id === id) || null,

  create: (data) => {
    const templates = readTemplates();
    const template = normalizeTemplate({
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    });
    templates.push(template);
    writeTemplates(templates);
    return template;
  },

  update: (id, data) => {
    const templates = readTemplates();
    const index = templates.findIndex((template) => template.id === id);
    if (index === -1) return null;

    const template = normalizeTemplate({
      ...templates[index],
      ...data,
      id,
      updated_at: new Date().toISOString(),
    });

    templates[index] = template;
    writeTemplates(templates);
    return template;
  },

  delete: (id) => {
    const templates = readTemplates();
    const index = templates.findIndex((template) => template.id === id);
    if (index === -1) return false;
    templates.splice(index, 1);
    writeTemplates(templates);
    return true;
  },
};

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = process.env.VERCEL
  ? '/tmp'
  : path.join(__dirname, '../data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readTemplates() {
  ensureDataDir();
  if (!fs.existsSync(TEMPLATES_FILE)) {
    const defaults = getDefaultTemplates();
    writeTemplates(defaults);
    return defaults;
  }
  try {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeTemplates(templates) {
  ensureDataDir();
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

function getDefaultTemplates() {
  const now = new Date().toISOString();
  return [
    {
      id: uuidv4(),
      name: 'FGI – Squadre',
      description: 'Premiazione con sole coppe (1°–3°)',
      podioMode: 'classificata',
      hasParticipation: false,
      podioDiameterMm: 40,
      categories: [
        {
          id: uuidv4(),
          name: 'SQUADRE',
          coppe: 3,
          medals: 0,
          diameterMm: 40,
          winnersPerPosition: 1,
          hasApparatus: false,
          apparatus: []
        }
      ],
      created_at: now
    },
    {
      id: uuidv4(),
      name: 'FGI – Silver',
      description: 'Solo medaglie Ø50 per 1°–3°. Nessuna coppa.',
      podioMode: 'classificata',
      hasParticipation: true,
      podioDiameterMm: 50,
      categories: [
        {
          id: uuidv4(),
          name: 'SILVER',
          coppe: 0,
          medals: 3,
          diameterMm: 50,
          winnersPerPosition: 1,
          hasApparatus: false,
          apparatus: []
        }
      ],
      created_at: now
    },
    {
      id: uuidv4(),
      name: 'UISP Emilia-Romagna – GAF',
      description: 'Prime 3 coppe + medaglie Ø40. Include medaglie attrezzi.',
      podioMode: 'classificata',
      hasParticipation: true,
      podioDiameterMm: 40,
      categories: [
        {
          id: uuidv4(),
          name: 'LA3 GIOVANISSIME',
          coppe: 3,
          medals: 10,
          diameterMm: 40,
          winnersPerPosition: 1,
          hasApparatus: true,
          apparatus: [
            { name: 'VOLTEGGIO', qty: 3, enabled: true },
            { name: 'PARALLELE', qty: 3, enabled: true },
            { name: 'TRAVE', qty: 3, enabled: true },
            { name: 'CORPO LIBERO', qty: 3, enabled: true }
          ]
        }
      ],
      created_at: now
    }
  ];
}

function ensureCategoryIds(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map(c => ({
    ...c,
    id: c.id || uuidv4(),
    apparatus: Array.isArray(c.apparatus) ? c.apparatus : []
  }));
}

module.exports = {
  getAll: () => readTemplates(),

  getById: (id) => readTemplates().find(t => t.id === id) || null,

  create: (data) => {
    const templates = readTemplates();
    const newTemplate = {
      ...data,
      id: uuidv4(),
      categories: ensureCategoryIds(data.categories),
      created_at: new Date().toISOString()
    };
    templates.push(newTemplate);
    writeTemplates(templates);
    return newTemplate;
  },

  update: (id, data) => {
    const templates = readTemplates();
    const idx = templates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    templates[idx] = {
      ...templates[idx],
      ...data,
      id,
      categories: ensureCategoryIds(data.categories || templates[idx].categories),
      updated_at: new Date().toISOString()
    };
    writeTemplates(templates);
    return templates[idx];
  },

  delete: (id) => {
    const templates = readTemplates();
    const idx = templates.findIndex(t => t.id === id);
    if (idx === -1) return false;
    templates.splice(idx, 1);
    writeTemplates(templates);
    return true;
  }
};

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesApi } from '../utils/api';
import { newCategory } from '../utils/labelUtils';
import { useTranslation } from '../utils/i18n';

const DIAMETERS = [40, 50, 70];

const FONT_OPTIONS = [
  { value: '', label: 'Default (Futura)' },
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: "'Times New Roman', Times, serif", label: 'Times New Roman' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
];

const APPARATUS_PRESETS = {
  gaf:    ['CORPO LIBERO', 'PARALLELE', 'VOLTEGGIO', 'TRAMPOLINO', 'TRAVE'],
  ritmica: ['CORPO LIBERO', 'PALLA', 'NASTRO', 'MAZZE', 'CORDA', 'CERCHIO'],
  trampo: ['TRAMPOLINO'],
};

function emptyTemplate() {
  return {
    name: '',
    description: '',
    podioMode: 'classificata',
    hasParticipation: true,
    participationDateBottom: true,
    podioDiameterMm: 40,
    logoSrc: '',
    fontFamily: '',
    labelWidthCm: null,   // null = use position-based defaults
    labelHeightCm: null,
    customPodioTexts: { 1: '', 2: '', 3: '' },
    categories: [newCategory({ apparatus: [] })]
  };
}

export default function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyTemplate());
  const [saving, setSaving] = useState(false);
  const [newAppNames, setNewAppNames] = useState({});
  const navigate = useNavigate();

  const PODIO_MODES = [
    { value: 'classificata', label: t('podio_classificata') },
    { value: 'classificato', label: t('podio_classificato') },
    { value: 'fasce', label: t('podio_fasce') },
    { value: 'non-classificata', label: t('podio_non_classificata') },
    { value: 'non-classificato', label: t('podio_non_classificato') },
  ];

  const load = useCallback(() => {
    setLoading(true);
    templatesApi.getAll()
      .then(setTemplates)
      .catch(() => setError(t('tmpl_connect_error')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditing(null);
    setForm(emptyTemplate());
    setNewAppNames({});
    setModalOpen(true);
  }

  function openEdit(tmpl) {
    setEditing(tmpl.id);
    setForm({
      name: tmpl.name || '',
      description: tmpl.description || '',
      podioMode: tmpl.podioMode || 'classificata',
      hasParticipation: tmpl.hasParticipation !== false,
      participationDateBottom: tmpl.participationDateBottom !== false,
      podioDiameterMm: tmpl.podioDiameterMm || 40,
      logoSrc: tmpl.logoSrc || '',
      fontFamily: tmpl.fontFamily || '',
      labelWidthCm: tmpl.labelWidthCm || null,
      labelHeightCm: tmpl.labelHeightCm || null,
      customPodioTexts: tmpl.customPodioTexts || { 1: '', 2: '', 3: '' },
      categories: (tmpl.categories || []).map(c => ({
        ...newCategory(),
        ...c,
        apparatus: Array.isArray(c.apparatus) ? c.apparatus : []
      }))
    });
    setNewAppNames({});
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return alert(t('tmpl_enter_name'));
    setSaving(true);
    try {
      if (editing) {
        await templatesApi.update(editing, form);
      } else {
        await templatesApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch {
      alert(t('tmpl_save_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(t('tmpl_delete_confirm'))) return;
    await templatesApi.delete(id);
    load();
  }

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateForm('logoSrc', reader.result);
    reader.readAsDataURL(file);
  }

  function addCategory() {
    setForm(prev => ({ ...prev, categories: [...prev.categories, newCategory({ apparatus: [] })] }));
  }

  function removeCategory(idx) {
    setForm(prev => ({ ...prev, categories: prev.categories.filter((_, i) => i !== idx) }));
  }

  function updateCategory(idx, field, value) {
    setForm(prev => {
      const cats = [...prev.categories];
      cats[idx] = { ...cats[idx], [field]: value };
      return { ...prev, categories: cats };
    });
  }

  function updateApparatus(catIdx, appIdx, field, value) {
    setForm(prev => {
      const cats = [...prev.categories];
      const app = [...cats[catIdx].apparatus];
      app[appIdx] = { ...app[appIdx], [field]: value };
      cats[catIdx] = { ...cats[catIdx], apparatus: app };
      return { ...prev, categories: cats };
    });
  }

  function addApparatus(catIdx) {
    const name = (newAppNames[catIdx] || '').trim().toUpperCase();
    if (!name) return;
    setForm(prev => {
      const cats = [...prev.categories];
      const existing = cats[catIdx].apparatus.map(a => a.name);
      if (existing.includes(name)) return prev;
      cats[catIdx] = {
        ...cats[catIdx],
        apparatus: [...cats[catIdx].apparatus, { name, qty: 3, enabled: true }]
      };
      return { ...prev, categories: cats };
    });
    setNewAppNames(prev => ({ ...prev, [catIdx]: '' }));
  }

  function removeApparatus(catIdx, appIdx) {
    setForm(prev => {
      const cats = [...prev.categories];
      cats[catIdx] = {
        ...cats[catIdx],
        apparatus: cats[catIdx].apparatus.filter((_, i) => i !== appIdx)
      };
      return { ...prev, categories: cats };
    });
  }

  function addApparatusPreset(catIdx, preset) {
    const names = APPARATUS_PRESETS[preset] || [];
    setForm(prev => {
      const cats = [...prev.categories];
      const existing = cats[catIdx].apparatus.map(a => a.name);
      const toAdd = names
        .filter(n => !existing.includes(n))
        .map(n => ({ name: n, qty: 3, enabled: true }));
      cats[catIdx] = {
        ...cats[catIdx],
        apparatus: [...cats[catIdx].apparatus, ...toAdd]
      };
      return { ...prev, categories: cats };
    });
  }

  const catLabel = (n) => `${n} ${n === 1 ? t('tmpl_cat_single') : t('tmpl_cat_plural')}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t('tmpl_title')}</h1>
          <p className="subtitle">{t('tmpl_subtitle')}</p>
        </div>
        <button className="btn btn-accent" onClick={openNew}>{t('tmpl_new')}</button>
      </div>

      {error && <div className="alert alert-warn">{error}</div>}

      {loading ? (
        <div className="loading">{t('tmpl_saving').replace('…', '')}…</div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <p>{t('tmpl_none')}</p>
          <button className="btn btn-accent" onClick={openNew}>{t('tmpl_create_first')}</button>
        </div>
      ) : (
        <div className="template-list">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="template-card">
              <div className="template-card-body">
                <div className="template-name">{tmpl.name}</div>
                <div className="template-desc">{tmpl.description}</div>
                <div className="template-meta">
                  {catLabel(tmpl.categories?.length || 0)} · Ø{tmpl.podioDiameterMm}mm
                  {tmpl.hasParticipation ? ` · ${t('tmpl_with_participation')}` : ''}
                </div>
              </div>
              <div className="template-card-actions">
                <button className="btn btn-sm btn-accent" onClick={() => navigate(`/generator?template=${tmpl.id}`)}>
                  {t('tmpl_use')}
                </button>
                <button className="btn btn-sm" onClick={() => openEdit(tmpl)}>{t('tmpl_edit')}</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tmpl.id)}>{t('tmpl_delete')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? t('tmpl_edit_title') : t('tmpl_new_title')}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Name & Description */}
              <div className="form-row">
                <div className="field">
                  <label>{t('tmpl_name_label')}</label>
                  <input value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder={t('tmpl_name_ph')} />
                </div>
                <div className="field">
                  <label>{t('tmpl_desc_label')}</label>
                  <input value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder={t('tmpl_desc_ph')} />
                </div>
              </div>

              {/* Logo */}
              <div className="form-row">
                <div className="field">
                  <label>{t('tmpl_logo_label')}</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  {form.logoSrc && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={form.logoSrc} alt="logo" style={{ height: 40, objectFit: 'contain', background: '#fff', padding: 3, borderRadius: 4 }} />
                      <button type="button" className="btn btn-sm btn-danger" onClick={() => updateForm('logoSrc', '')}>{t('tmpl_logo_clear')}</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Podio + Diameter + Participation */}
              <div className="form-row">
                <div className="field">
                  <label>{t('tmpl_podio_label')}</label>
                  <select value={form.podioMode} onChange={e => updateForm('podioMode', e.target.value)}>
                    {PODIO_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('tmpl_diam_label')}</label>
                  <select value={form.podioDiameterMm} onChange={e => updateForm('podioDiameterMm', parseInt(e.target.value))}>
                    {DIAMETERS.map(d => <option key={d} value={d}>{d}mm</option>)}
                  </select>
                </div>
                <div className="field field-checkbox">
                  <label>{t('tmpl_participation_label')}</label>
                  <input type="checkbox" checked={form.hasParticipation} onChange={e => updateForm('hasParticipation', e.target.checked)} />
                </div>
                {form.hasParticipation && (
                  <div className="field field-checkbox">
                    <label>{t('tmpl_participation_date_label')}</label>
                    <input type="checkbox" checked={form.participationDateBottom} onChange={e => updateForm('participationDateBottom', e.target.checked)} />
                  </div>
                )}
              </div>

              {/* Label style: font + size */}
              <div className="section-title">{t('tmpl_label_size_section')}</div>
              <div className="form-row">
                <div className="field">
                  <label>{t('tmpl_font_label')}</label>
                  <select value={form.fontFamily} onChange={e => updateForm('fontFamily', e.target.value)}>
                    {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>{t('tmpl_label_width')} <small style={{color:'#888'}}>(default: 5.5/5.0/4.5)</small></label>
                  <input
                    type="number" min="2" max="30" step="0.5"
                    value={form.labelWidthCm || ''}
                    placeholder="auto"
                    onChange={e => updateForm('labelWidthCm', e.target.value ? parseFloat(e.target.value) : null)}
                    style={{ width: 80 }}
                  />
                </div>
                <div className="field">
                  <label>{t('tmpl_label_height')} <small style={{color:'#888'}}>(default: 2.3)</small></label>
                  <input
                    type="number" min="1" max="15" step="0.1"
                    value={form.labelHeightCm || ''}
                    placeholder="auto"
                    onChange={e => updateForm('labelHeightCm', e.target.value ? parseFloat(e.target.value) : null)}
                    style={{ width: 80 }}
                  />
                </div>
              </div>

              {/* Custom podio texts */}
              <div className="section-title">{t('tmpl_custom_podio_section')}</div>
              <div className="form-row">
                {[1, 2, 3].map(pos => (
                  <div className="field" key={pos}>
                    <label>{pos === 1 ? t('tmpl_custom_podio_1') : pos === 2 ? t('tmpl_custom_podio_2') : t('tmpl_custom_podio_3')}</label>
                    <input
                      value={form.customPodioTexts?.[pos] || ''}
                      placeholder={t('tmpl_custom_podio_ph')}
                      onChange={e => updateForm('customPodioTexts', { ...form.customPodioTexts, [pos]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              {/* Categories */}
              <div className="section-title">{t('tmpl_categories_section')}</div>
              {form.categories.map((cat, i) => (
                <div key={cat.id} className="cat-row">
                  <div className="cat-row-top">
                    <div className="field flex2">
                      <label>{t('tmpl_col_category')}</label>
                      <input value={cat.name} onChange={e => updateCategory(i, 'name', e.target.value)} />
                    </div>
                    <div className="field">
                      <label>{t('tmpl_col_trophies')}</label>
                      <input type="number" min="0" max="10" value={cat.coppe} onChange={e => updateCategory(i, 'coppe', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="field">
                      <label>{t('tmpl_col_medals')}</label>
                      <input type="number" min="0" max="20" value={cat.medals} onChange={e => updateCategory(i, 'medals', parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="field">
                      <label>{t('tmpl_col_diam')}</label>
                      <select value={cat.diameterMm} onChange={e => updateCategory(i, 'diameterMm', parseInt(e.target.value))}>
                        {DIAMETERS.map(d => <option key={d} value={d}>{d}mm</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>{t('tmpl_col_winners')}</label>
                      <input type="number" min="1" max="20" value={cat.winnersPerPosition || 1} onChange={e => updateCategory(i, 'winnersPerPosition', parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="field">
                      <label>Trophy text align</label>
                      <select value={cat.trophyAlignment || 'center'} onChange={e => updateCategory(i, 'trophyAlignment', e.target.value)}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Trophy logo align</label>
                      <select value={cat.trophyLogoAlignment || 'left'} onChange={e => updateCategory(i, 'trophyLogoAlignment', e.target.value)}>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="field field-checkbox">
                      <label>{t('tmpl_col_apparatus')}</label>
                      <input type="checkbox" checked={cat.hasApparatus} onChange={e => updateCategory(i, 'hasApparatus', e.target.checked)} />
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => removeCategory(i)}>✕</button>
                  </div>

                  {cat.hasApparatus && (
                    <div className="apparatus-section">
                      {/* Preset buttons */}
                      <div className="apparatus-presets">
                        <span style={{ fontSize: 11, color: '#888', marginRight: 6 }}>Preset:</span>
                        <button type="button" className="btn btn-xs btn-outline" onClick={() => addApparatusPreset(i, 'gaf')}>{t('tmpl_apparatus_preset_gaf')}</button>
                        <button type="button" className="btn btn-xs btn-outline" onClick={() => addApparatusPreset(i, 'ritmica')}>{t('tmpl_apparatus_preset_rg')}</button>
                        <button type="button" className="btn btn-xs btn-outline" onClick={() => addApparatusPreset(i, 'trampo')}>{t('tmpl_apparatus_preset_trampo')}</button>
                      </div>

                      {/* Added apparatus list */}
                      <div className="apparatus-grid">
                        {(cat.apparatus || []).map((app, ai) => (
                          <div key={ai} className="app-item">
                            <input
                              value={app.name}
                              onChange={e => updateApparatus(i, ai, 'name', e.target.value.toUpperCase())}
                              style={{ width: 120, fontSize: 12 }}
                            />
                            <input
                              type="number" min="1" max="20" value={app.qty}
                              onChange={e => updateApparatus(i, ai, 'qty', parseInt(e.target.value) || 1)}
                              style={{ width: 50 }}
                            />
                            <button type="button" className="btn btn-xs btn-danger" onClick={() => removeApparatus(i, ai)}>{t('tmpl_apparatus_remove')}</button>
                          </div>
                        ))}
                      </div>

                      {/* Add new apparatus */}
                      <div className="apparatus-add-row">
                        <input
                          value={newAppNames[i] || ''}
                          onChange={e => setNewAppNames(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder={t('tmpl_apparatus_name_ph')}
                          onKeyDown={e => e.key === 'Enter' && addApparatus(i)}
                          style={{ width: 180, fontSize: 12 }}
                        />
                        <button type="button" className="btn btn-sm btn-outline" onClick={() => addApparatus(i)}>{t('tmpl_apparatus_add')}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button className="btn btn-outline" onClick={addCategory}>{t('tmpl_add_category')}</button>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setModalOpen(false)}>{t('tmpl_cancel')}</button>
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? t('tmpl_saving') : t('tmpl_save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

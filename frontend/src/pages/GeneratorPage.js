import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { templatesApi, excelApi } from '../utils/api';
import { APPARATUS_LIST, newCategory, generateAllLabels, downloadSvgSheet, printAsPdf } from '../utils/labelUtils';
import { useTranslation } from '../utils/i18n';
import MedalLabel from '../components/labels/MedalLabel';
import RetroLabel from '../components/labels/RetroLabel';
import RectLabel from '../components/labels/RectLabel';

const SHEET_SIZES = [
  { key: 'A4P',   label: 'A4 Portrait (210×297mm)',  w: 210 },
  { key: 'A4L',   label: 'A4 Landscape (297×210mm)', w: 297 },
  { key: 'A3L',   label: 'A3 Landscape (420×297mm)', w: 420 },
  { key: 'SRA3',  label: 'SRA3 (450×320mm)',          w: 450 },
  { key: 'roll',  label: 'Plotter Roll (297mm)',       w: 297 },
  { key: 'custom', label: 'Custom / Personalizzato',  w: null },
];

export default function GeneratorPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const PODIO_MODES = [
    { value: 'classificata', label: t('podio_classificata') },
    { value: 'classificato', label: t('podio_classificato') },
    { value: 'fasce', label: t('podio_fasce') }
  ];

  // Event config
  const [eventName, setEventName] = useState('1° PROVA CAMPIONATO REGIONALE FGI GAF');
  const [locationDate, setLocationDate] = useState('Metato, 22 Febbraio 2026');
  const [logoSrc, setLogoSrc] = useState('');
  const [podioMode, setPodioMode] = useState('classificata');
  const [hasParticipation, setHasParticipation] = useState(true);
  const [participationCount, setParticipationCount] = useState(1);

  // Sheet / export
  const [sheetSizeKey, setSheetSizeKey] = useState('A4P');
  const [customW, setCustomW] = useState(297);

  // Categories
  const [categories, setCategories] = useState([newCategory()]);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Labels preview
  const [labels, setLabels] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const previewRef = useRef(null);

  // Excel modal
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [colMap, setColMap] = useState({ category: '', coppe: '', medals: '', diameter: '', winners: '' });
  const [excelLoading, setExcelLoading] = useState(false);

  useEffect(() => {
    templatesApi.getAll().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    const tid = searchParams.get('template');
    if (tid && templates.length > 0) {
      applyTemplate(tid);
      setSelectedTemplateId(tid);
    }
  }, [searchParams, templates]); // eslint-disable-line

  function applyTemplate(id) {
    const tmpl = templates.find(t => t.id === id);
    if (!tmpl) return;
    setPodioMode(tmpl.podioMode || 'classificata');
    setHasParticipation(tmpl.hasParticipation !== false);
    if (tmpl.logoSrc) setLogoSrc(tmpl.logoSrc);
    setCategories((tmpl.categories || []).map(c => ({
      ...newCategory(),
      ...c,
      apparatus: (c.apparatus && c.apparatus.length > 0)
        ? c.apparatus
        : APPARATUS_LIST.map(name => ({ name, qty: 3, enabled: false }))
    })));
  }

  function handleTemplateSelect(e) {
    const id = e.target.value;
    setSelectedTemplateId(id);
    if (id) applyTemplate(id);
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoSrc(reader.result);
    reader.readAsDataURL(file);
  }

  function addCategory() {
    setCategories(prev => [...prev, newCategory({ name: 'Nuova Categoria' })]);
  }

  function removeCategory(idx) {
    setCategories(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCat(idx, field, value) {
    setCategories(prev => {
      const cats = [...prev];
      cats[idx] = { ...cats[idx], [field]: value };
      if (field === 'hasApparatus' && value && (!cats[idx].apparatus || cats[idx].apparatus.length === 0)) {
        cats[idx].apparatus = APPARATUS_LIST.map(name => ({ name, qty: 3, enabled: true }));
      }
      return cats;
    });
  }

  function updateApparatus(catIdx, appIdx, field, value) {
    setCategories(prev => {
      const cats = [...prev];
      const app = [...cats[catIdx].apparatus];
      app[appIdx] = { ...app[appIdx], [field]: value };
      cats[catIdx] = { ...cats[catIdx], apparatus: app };
      return cats;
    });
  }

  function getSheetW() {
    if (sheetSizeKey === 'custom') return Math.max(50, customW || 297);
    return SHEET_SIZES.find(s => s.key === sheetSizeKey)?.w || 297;
  }

  const getConfig = useCallback(() => ({
    eventName, locationDate, logoSrc, podioMode, hasParticipation, participationCount, categories
  }), [eventName, locationDate, logoSrc, podioMode, hasParticipation, participationCount, categories]);

  function generate(group) {
    const all = generateAllLabels(getConfig());
    setLabels(group === 'all' ? all : all.filter(l => l.group === group));
    setActiveGroup(group);
    setTimeout(() => {
      document.getElementById('preview-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  function handleDownloadSvg() {
    if (previewRef.current) {
      downloadSvgSheet(previewRef.current, `etichette-${activeGroup || 'tutte'}.svg`, getSheetW());
    }
  }

  function handlePrintPdf() {
    if (previewRef.current) {
      printAsPdf(previewRef.current, getSheetW());
    }
  }

  // Excel import
  async function handleExcelUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelLoading(true);
    try {
      const result = await excelApi.parse(file);
      setExcelHeaders(result.headers || []);
      setExcelRows(result.rows || []);
      setColMap({ category: '', coppe: '', medals: '', diameter: '', winners: '' });
      setShowExcelModal(true);
    } catch {
      alert(t('excel_error'));
    } finally {
      setExcelLoading(false);
    }
    e.target.value = '';
  }

  function applyExcelImport() {
    const getVal = (row, header) => {
      if (!header) return null;
      const idx = excelHeaders.indexOf(header);
      return idx >= 0 ? row[idx] : null;
    };

    const newCats = excelRows
      .map(row => {
        const name = String(getVal(row, colMap.category) || '').trim();
        if (!name) return null;
        return newCategory({
          name,
          coppe: parseInt(getVal(row, colMap.coppe)) || 3,
          medals: parseInt(getVal(row, colMap.medals)) || 5,
          diameterMm: parseInt(getVal(row, colMap.diameter)) || 40,
          winnersPerPosition: parseInt(getVal(row, colMap.winners)) || 1
        });
      })
      .filter(Boolean);

    if (newCats.length > 0) setCategories(newCats);
    setShowExcelModal(false);
  }

  function renderLabel(label, idx) {
    return (
      <div className="label-wrapper" key={`${label.type}-${idx}`}>
        {label.type === 'medal-front' && (
          <MedalLabel topText={label.topText} bottomText={label.bottomText} logoSrc={logoSrc} diameterMm={label.diameterMm} />
        )}
        {label.type === 'medal-back' && (
          <RetroLabel category={label.category} subCategory={label.subCategory} position={label.position} locationDate={label.locationDate} diameterMm={label.diameterMm} />
        )}
        {label.type === 'rect' && (
          <RectLabel competitionName={label.competitionName} category={label.category} position={label.position} locationDate={label.locationDate} logoSrc={logoSrc} widthCm={label.widthCm} />
        )}
        <div className="label-tag">{label.tag}</div>
      </div>
    );
  }

  const labelCountText = (n) => `${n} ${n === 1 ? t('gen_label_single') : t('gen_label_plural')}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t('gen_title')}</h1>
          <p className="subtitle">{t('gen_subtitle')}</p>
        </div>
      </div>

      {/* Template selector */}
      <div className="config-section">
        <div className="section-label">{t('gen_type_section')}</div>
        <select className="template-select" value={selectedTemplateId} onChange={handleTemplateSelect}>
          <option value="">{t('gen_custom_option')}</option>
          {templates.map(tmpl => (
            <option key={tmpl.id} value={tmpl.id}>{tmpl.name} – {tmpl.description}</option>
          ))}
        </select>
      </div>

      {/* Event details */}
      <div className="config-section">
        <div className="section-label">{t('gen_event_section')}</div>
        <div className="form-grid">
          <div className="field">
            <label>{t('gen_event_name_label')}</label>
            <input value={eventName} onChange={e => setEventName(e.target.value)} placeholder="1° PROVA CAMPIONATO..." />
          </div>
          <div className="field">
            <label>{t('gen_location_label')}</label>
            <input value={locationDate} onChange={e => setLocationDate(e.target.value)} placeholder="Città, GG Mese AAAA" />
          </div>
          <div className="field">
            <label>{t('gen_logo_label')}</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} />
          </div>
          <div className="field">
            <label>{t('gen_podio_label')}</label>
            <select value={podioMode} onChange={e => setPodioMode(e.target.value)}>
              {PODIO_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="field field-checkbox">
            <label>{t('gen_participation_label')}</label>
            <input type="checkbox" checked={hasParticipation} onChange={e => setHasParticipation(e.target.checked)} />
          </div>
          {hasParticipation && (
            <div className="field">
              <label>{t('gen_participation_count')}</label>
              <input type="number" min="1" max="9999" value={participationCount}
                onChange={e => setParticipationCount(parseInt(e.target.value) || 1)}
                style={{ width: 100 }} />
            </div>
          )}
          {logoSrc && (
            <div className="field">
              <label>{t('gen_logo_preview')}</label>
              <img src={logoSrc} alt="logo" style={{ height: 50, objectFit: 'contain', background: '#fff', padding: 4, borderRadius: 4 }} />
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="config-section">
        <div className="section-label-row">
          <div className="section-label">{t('gen_categories_section')}</div>
          <div className="section-label-actions">
            <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer' }}>
              {excelLoading ? t('gen_loading_excel') : t('gen_import_excel')}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <div className="cat-table">
          <div className="cat-table-header">
            <span>{t('gen_col_category')}</span>
            <span>{t('gen_col_trophies')}</span>
            <span>{t('gen_col_medals')}</span>
            <span>{t('gen_col_diam')}</span>
            <span>{t('gen_col_winners')}</span>
            <span>{t('gen_col_apparatus')}</span>
            <span></span>
          </div>

          {categories.map((cat, i) => (
            <div key={cat.id} className="cat-table-row-group">
              <div className="cat-table-row">
                <input className="cat-input" value={cat.name} onChange={e => updateCat(i, 'name', e.target.value)} />
                <input type="number" min="0" max="10" className="cat-input-sm" value={cat.coppe} onChange={e => updateCat(i, 'coppe', parseInt(e.target.value) || 0)} />
                <input type="number" min="0" max="20" className="cat-input-sm" value={cat.medals} onChange={e => updateCat(i, 'medals', parseInt(e.target.value) || 0)} />
                <select className="cat-input-sm" value={cat.diameterMm} onChange={e => updateCat(i, 'diameterMm', parseInt(e.target.value))}>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                  <option value={70}>70</option>
                </select>
                <input type="number" min="1" max="20" className="cat-input-sm" value={cat.winnersPerPosition || 1}
                  onChange={e => updateCat(i, 'winnersPerPosition', parseInt(e.target.value) || 1)}
                  title={t('gen_winners_tooltip')} />
                <input type="checkbox" checked={cat.hasApparatus} onChange={e => updateCat(i, 'hasApparatus', e.target.checked)} title={t('gen_col_apparatus')} />
                <button className="btn btn-sm btn-danger" onClick={() => removeCategory(i)}>✕</button>
              </div>

              {cat.hasApparatus && (
                <div className="apparatus-row">
                  {(cat.apparatus || []).map((app, ai) => (
                    <div key={app.name} className="app-chip">
                      <label>
                        <input type="checkbox" checked={app.enabled} onChange={e => updateApparatus(i, ai, 'enabled', e.target.checked)} />
                        {app.name}
                      </label>
                      <input type="number" min="1" max="20" value={app.qty} disabled={!app.enabled}
                        onChange={e => updateApparatus(i, ai, 'qty', parseInt(e.target.value) || 1)} style={{ width: 50 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-outline" onClick={addCategory}>{t('gen_add_category')}</button>
      </div>

      {/* Generate buttons */}
      <div className="gen-buttons">
        <button className="btn btn-gen" onClick={() => generate('partecipazione')}>{t('gen_btn_participation')}</button>
        <button className="btn btn-gen" onClick={() => generate('coppe')}>{t('gen_btn_trophies')}</button>
        <button className="btn btn-gen" onClick={() => generate('medaglie')}>{t('gen_btn_medals')}</button>
        <button className="btn btn-gen btn-gen-all" onClick={() => generate('all')}>{t('gen_btn_all')}</button>
      </div>

      {/* Preview */}
      {labels.length > 0 && (
        <div id="preview-area" className="preview-section">
          <div className="preview-header">
            <h2>{t('gen_preview_title')} – {labelCountText(labels.length)}</h2>
            <div className="preview-actions">
              <div className="sheet-size-row">
                <span className="sheet-size-label">{t('gen_sheet_size')}:</span>
                <select value={sheetSizeKey} onChange={e => setSheetSizeKey(e.target.value)} className="sheet-size-select">
                  {SHEET_SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                {sheetSizeKey === 'custom' && (
                  <>
                    <input type="number" min="50" max="2000" value={customW}
                      onChange={e => setCustomW(parseInt(e.target.value) || 297)}
                      className="sheet-size-input"
                      placeholder={t('gen_sheet_custom_w')} />
                    <span className="sheet-size-label">mm</span>
                  </>
                )}
              </div>
              <button className="btn btn-accent" onClick={handleDownloadSvg}>{t('gen_download_svg')}</button>
              <button className="btn btn-outline" onClick={handlePrintPdf}>{t('gen_download_pdf')}</button>
              <button className="btn btn-outline" onClick={() => window.print()}>{t('gen_print')}</button>
            </div>
          </div>
          <div className="preview-area" ref={previewRef}>
            {labels.map((label, i) => renderLabel(label, i))}
          </div>
        </div>
      )}

      {/* Excel modal */}
      {showExcelModal && (
        <div className="modal-overlay" onClick={() => setShowExcelModal(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{t('excel_title')}</h2>
              <button className="modal-close" onClick={() => setShowExcelModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="mb-16">
                {t('excel_loaded')} <strong>{excelRows.length} {t('excel_rows')}</strong>,{' '}
                <strong>{excelHeaders.length} {t('excel_cols')}</strong>. {t('excel_map_desc')}
              </p>
              <div className="form-grid">
                {[
                  { key: 'category', label: t('excel_col_category') },
                  { key: 'coppe',    label: t('excel_col_trophies') },
                  { key: 'medals',   label: t('excel_col_medals') },
                  { key: 'diameter', label: t('excel_col_diam') },
                  { key: 'winners',  label: t('excel_col_winners') }
                ].map(({ key, label }) => (
                  <div className="field" key={key}>
                    <label>{label}</label>
                    <select value={colMap[key]} onChange={e => setColMap(prev => ({ ...prev, [key]: e.target.value }))}>
                      <option value="">{t('excel_none_option')}</option>
                      {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              {excelRows.length > 0 && (
                <div className="excel-preview">
                  <table>
                    <thead>
                      <tr>{excelHeaders.map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {excelRows.slice(0, 5).map((row, i) => (
                        <tr key={i}>{excelHeaders.map((_, ci) => <td key={ci}>{String(row[ci] ?? '')}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                  {excelRows.length > 5 && (
                    <p className="table-more">… {t('excel_more_rows').replace('altre ', '')} {excelRows.length - 5} {t('excel_more_rows').includes('altre') ? t('excel_rows') : t('excel_rows')}</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowExcelModal(false)}>{t('excel_cancel')}</button>
              <button className="btn btn-accent" disabled={!colMap.category} onClick={applyExcelImport}>
                {t('excel_import_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

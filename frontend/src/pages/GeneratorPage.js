import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { templatesApi, excelApi } from "../utils/api";
import {
  TROPHY_SIZE_PRESETS,
  downloadSvgSheet,
  generateAllLabels,
  newCategory,
  normalizeTemplate,
  printAsPdf,
} from "../utils/labelUtils";
import { useTranslation } from "../utils/i18n";
import MedalLabel from "../components/labels/MedalLabel";
import RetroLabel from "../components/labels/RetroLabel";
import RectLabel from "../components/labels/RectLabel";

const SHEET_SIZES = [
  { key: "A4P", label: "A4 Portrait (210x297mm)", w: 210 },
  { key: "A4L", label: "A4 Landscape (297x210mm)", w: 297 },
  { key: "A3L", label: "A3 Landscape (420x297mm)", w: 420 },
  { key: "SRA3", label: "SRA3 (450x320mm)", w: 450 },
  { key: "custom", label: "Custom width", w: null },
];

const BREAK_FIELDS = [
  { value: "rowA", label: "Row A" },
  { value: "rowB", label: "Row B" },
  { value: "rowC", label: "Row C" },
  { value: "reference", label: "Reference" },
];

const PODIUM_OPTIONS = [
  { value: "class", label: "1° CLASS. / 2° CLASS. / 3° CLASS." },
  { value: "numeric", label: "1° / 2° / 3°" },
];

function buildDefaultConfig() {
  return normalizeTemplate({
    raceTitleRow1: "RACE TITLE",
    raceTitleRow2: "",
    locationDate: "CITY, 22 FEB 2026",
    participationCount: 1,
    categoryBreakField: "rowA",
    trophyBreakField: "rowA",
    breakGapMm: 20,
    categories: [newCategory({ reference: "CATEGORY 1", rowA: "CATEGORY", rowB: "WOMEN" })],
  });
}

export default function GeneratorPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [config, setConfig] = useState(buildDefaultConfig);
  const [labels, setLabels] = useState([]);
  const [sheetSizeKey, setSheetSizeKey] = useState("A4P");
  const [customW, setCustomW] = useState(297);
  const [labelSpacingMm, setLabelSpacingMm] = useState(5);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelRows, setExcelRows] = useState([]);
  const [excelLoading, setExcelLoading] = useState(false);
  const [colMap, setColMap] = useState({
    reference: "",
    rowA: "",
    rowB: "",
    rowC: "",
    medals: "",
    coppe: "",
    copiesPerRank: "",
    podiumText: "",
  });
  const previewRef = useRef(null);

  useEffect(() => {
    templatesApi.getAll().then(setTemplates).catch(() => {});
  }, []);

  useEffect(() => {
    const templateId = searchParams.get("template");
    if (!templateId || templates.length === 0) return;
    const template = templates.find((item) => item.id === templateId);
    if (template) {
      setSelectedTemplateId(template.id);
      setConfig(normalizeTemplate(template));
    }
  }, [searchParams, templates]);

  const previewStats = useMemo(() => {
    const participation = labels.filter((label) => label.group === "participation").length;
    const categoryMedals = labels.filter((label) => label.group === "category-medals").length;
    const trophies = labels.filter((label) => label.group === "trophies").length;
    return { participation, categoryMedals, trophies };
  }, [labels]);

  function updateConfig(field, value) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  function updateCategory(index, field, value) {
    setConfig((prev) => {
      const categories = [...prev.categories];
      categories[index] = { ...categories[index], [field]: value };
      return { ...prev, categories };
    });
  }

  function updateTrophySizeForRank(categoryIndex, rank, widthCm, heightCm) {
    setConfig((prev) => {
      const categories = [...prev.categories];
      const cat = categories[categoryIndex];
      categories[categoryIndex] = {
        ...cat,
        trophyWidthCmByRank: { ...(cat.trophyWidthCmByRank || {}), [rank]: widthCm },
        trophyHeightCmByRank: { ...(cat.trophyHeightCmByRank || {}), [rank]: heightCm },
      };
      return { ...prev, categories };
    });
  }

  function updatePodiumOverride(index, rank, value) {
    setConfig((prev) => {
      const categories = [...prev.categories];
      const category = categories[index];
      categories[index] = {
        ...category,
        podiumTextByRank: {
          ...(category.podiumTextByRank || {}),
          [rank]: value,
        },
      };
      return { ...prev, categories };
    });
  }

  function addCategory() {
    setConfig((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        newCategory({
          reference: `CATEGORY ${prev.categories.length + 1}`,
          rowA: "CATEGORY",
        }),
      ],
    }));
  }

  function removeCategory(index) {
    setConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function applyTemplate(templateId) {
    setSelectedTemplateId(templateId);
    const template = templates.find((item) => item.id === templateId);
    if (!template) return;
    setConfig(normalizeTemplate(template));
    setLabels([]);
  }

  function handleImageUpload(field, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateConfig(field, reader.result);
    reader.readAsDataURL(file);
  }

  function getSheetWidth() {
    if (sheetSizeKey === "custom") return Math.max(80, parseInt(customW, 10) || 297);
    return SHEET_SIZES.find((item) => item.key === sheetSizeKey)?.w || 297;
  }

  function generate(group = "all") {
    const allLabels = generateAllLabels(config);
    setLabels(group === "all" ? allLabels : allLabels.filter((label) => label.group === group));
    setTimeout(() => {
      document.getElementById("preview-area")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function handleDownloadSvg() {
    if (!previewRef.current) return;
    downloadSvgSheet(previewRef.current, "stickers.svg", getSheetWidth(), labelSpacingMm, {
      breakGapMm: config.breakGapMm,
    });
  }

  function handlePrintPdf() {
    if (!previewRef.current) return;
    printAsPdf(previewRef.current, getSheetWidth(), labelSpacingMm, {
      breakGapMm: config.breakGapMm,
    });
  }

  async function handleExcelUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setExcelLoading(true);
    try {
      const result = await excelApi.parse(file);
      setExcelHeaders(result.headers || []);
      setExcelRows(result.rows || []);
      setShowExcelModal(true);
    } catch {
      alert("Excel parsing failed.");
    } finally {
      setExcelLoading(false);
    }
    event.target.value = "";
  }

  function applyExcelImport() {
    const indexOf = (header) => excelHeaders.indexOf(header);
    const getValue = (row, key) => {
      const header = colMap[key];
      const index = indexOf(header);
      return index >= 0 ? row[index] : "";
    };

    const categories = excelRows
      .map((row, rowIndex) =>
        newCategory({
          reference: String(getValue(row, "reference") || `ROW ${rowIndex + 1}`).trim(),
          rowA: String(getValue(row, "rowA") || "").trim(),
          rowB: String(getValue(row, "rowB") || "").trim(),
          rowC: String(getValue(row, "rowC") || "").trim(),
          medals: parseInt(getValue(row, "medals"), 10) || 0,
          coppe: parseInt(getValue(row, "coppe"), 10) || 0,
          copiesPerRank: parseInt(getValue(row, "copiesPerRank"), 10) || 1,
          podiumText: String(getValue(row, "podiumText") || "").trim(),
        }),
      )
      .filter((category) => category.reference || category.rowA || category.rowB || category.rowC);

    if (categories.length > 0) {
      updateConfig("categories", categories);
    }
    setShowExcelModal(false);
  }

  function renderLabel(label) {
    if (label.type === "participation-medal") {
      return (
        <MedalLabel
          raceTitleRow1={label.raceTitleRow1}
          raceTitleRow2={label.raceTitleRow2}
          locationDate={label.locationDate}
          logoSrc={label.logoSrc}
        />
      );
    }

    if (label.type === "category-medal") {
      return (
        <RetroLabel
          raceTitleRow1={label.raceTitleRow1}
          raceTitleRow2={label.raceTitleRow2}
          categoryLines={label.categoryLines}
          podiumText={label.podiumText}
          locationDate={label.locationDate}
          hideTitle={label.hideTitle}
          hideDate={label.hideDate}
        />
      );
    }

    return (
      <RectLabel
        raceTitleRow1={label.raceTitleRow1}
        raceTitleRow2={label.raceTitleRow2}
        categoryLines={label.categoryLines}
        podiumText={label.podiumText}
        locationDate={label.locationDate}
        logoSrc={label.logoSrc}
        align={label.align}
        logoAlign={label.logoAlign}
        widthCm={label.widthCm}
        heightCm={label.heightCm}
        titleHidden={label.titleHidden}
      />
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t("gen_title")}</h1>
          <p className="subtitle">Updated to the client PDF spec: participation medals, category medals, trophies, Illustrator-ready SVG export.</p>
        </div>
      </div>

      <div className="config-section">
        <div className="section-label">Template</div>
        <select className="template-select" value={selectedTemplateId} onChange={(event) => applyTemplate(event.target.value)}>
          <option value="">{t("gen_custom_option")}</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div className="config-section">
        <div className="section-label">Global Race Data</div>
        <div className="form-grid">
          <div className="field">
            <label>
              Race title row 1
              {config.raceTitleRow1.length > 35 ? (
                <span style={{ color: "#e6007e", marginLeft: 6, fontSize: "0.8em" }}>
                  {config.raceTitleRow1.length} chars — add Row 2 for overflow
                </span>
              ) : null}
            </label>
            <input value={config.raceTitleRow1} onChange={(event) => updateConfig("raceTitleRow1", event.target.value)} />
          </div>
          <div className="field">
            <label>Race title row 2 <span style={{ opacity: 0.6, fontSize: "0.8em" }}>(max 20 chars)</span></label>
            <input
              value={config.raceTitleRow2}
              onChange={(event) => updateConfig("raceTitleRow2", event.target.value)}
              placeholder="Optional when title is long"
              maxLength={20}
            />
          </div>
          <div className="field">
            <label>Location / date</label>
            <input value={config.locationDate} onChange={(event) => updateConfig("locationDate", event.target.value)} />
          </div>
          <div className="field">
            <label>Podium preset</label>
            <select value={config.podiumPreset} onChange={(event) => updateConfig("podiumPreset", event.target.value)}>
              {PODIUM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Participation logo</label>
            <input type="file" accept="image/*" onChange={(event) => handleImageUpload("participationLogoSrc", event)} />
          </div>
          <div className="field">
            <label>Trophy logo</label>
            <input type="file" accept="image/*" onChange={(event) => handleImageUpload("trophyLogoSrc", event)} />
          </div>
          <div className="field">
            <label>Participation quantity</label>
            <input type="number" min="0" value={config.participationCount} onChange={(event) => updateConfig("participationCount", parseInt(event.target.value, 10) || 0)} />
          </div>
          <div className="field">
            <label>Category medal break row</label>
            <select value={config.categoryBreakField} onChange={(event) => updateConfig("categoryBreakField", event.target.value)}>
              {BREAK_FIELDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Trophy break row</label>
            <select value={config.trophyBreakField} onChange={(event) => updateConfig("trophyBreakField", event.target.value)}>
              {BREAK_FIELDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Extra break gap (mm)</label>
            <input type="number" min="0" max="100" value={config.breakGapMm} onChange={(event) => updateConfig("breakGapMm", parseInt(event.target.value, 10) || 0)} />
          </div>
        </div>
      </div>

      <div className="config-section">
        <div className="section-label-row">
          <div className="section-label">Categories / Layout Blocks</div>
          <label className="btn btn-sm btn-outline" style={{ cursor: "pointer" }}>
            {excelLoading ? "Loading..." : "Import Excel"}
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleExcelUpload} />
          </label>
        </div>

        {config.categories.map((category, index) => (
          <div key={category.id} className="cat-row">
            <div className="cat-row-top">
              <div className="field flex2">
                <label>Reference</label>
                <input value={category.reference} onChange={(event) => updateCategory(index, "reference", event.target.value)} />
              </div>
              <div className="field">
                <label>Category medals</label>
                <input type="number" min="0" value={category.medals} onChange={(event) => updateCategory(index, "medals", parseInt(event.target.value, 10) || 0)} />
              </div>
              <div className="field">
                <label>Trophies</label>
                <input type="number" min="0" value={category.coppe} onChange={(event) => updateCategory(index, "coppe", parseInt(event.target.value, 10) || 0)} />
              </div>
              <div className="field">
                <label>Copies / rank</label>
                <input type="number" min="1" value={category.copiesPerRank} onChange={(event) => updateCategory(index, "copiesPerRank", parseInt(event.target.value, 10) || 1)} />
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => removeCategory(index)}>
                Remove
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Row A</label>
                <input value={category.rowA} onChange={(event) => updateCategory(index, "rowA", event.target.value)} />
              </div>
              <div className="field">
                <label>Row B</label>
                <input value={category.rowB} onChange={(event) => updateCategory(index, "rowB", event.target.value)} />
              </div>
              <div className="field">
                <label>Row C</label>
                <input value={category.rowC} onChange={(event) => updateCategory(index, "rowC", event.target.value)} />
              </div>
              <div className="field">
                <label>Podium preset</label>
                <select value={category.podiumPreset} onChange={(event) => updateCategory(index, "podiumPreset", event.target.value)}>
                  {PODIUM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Single podium text</label>
                <input value={category.podiumText} onChange={(event) => updateCategory(index, "podiumText", event.target.value)} placeholder="Optional override for all ranks" />
              </div>
              <div className="field field-checkbox">
                <label>Hide category medal</label>
                <input type="checkbox" checked={category.hideCategoryMedal} onChange={(event) => updateCategory(index, "hideCategoryMedal", event.target.checked)} />
              </div>
              <div className="field field-checkbox">
                <label>Hide medal title</label>
                <input type="checkbox" checked={category.hideCategoryTitle} onChange={(event) => updateCategory(index, "hideCategoryTitle", event.target.checked)} />
              </div>
              <div className="field field-checkbox">
                <label>Hide medal date</label>
                <input type="checkbox" checked={category.hideCategoryDate} onChange={(event) => updateCategory(index, "hideCategoryDate", event.target.checked)} />
              </div>
              <div className="field field-checkbox">
                <label>Hide trophy title</label>
                <input type="checkbox" checked={category.hideTrophyTitle} onChange={(event) => updateCategory(index, "hideTrophyTitle", event.target.checked)} />
              </div>
              <div className="field">
                <label>Trophy text align</label>
                <select value={category.trophyAlignment} onChange={(event) => updateCategory(index, "trophyAlignment", event.target.value)}>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="field">
                <label>Trophy logo align</label>
                <select value={category.trophyLogoAlignment} onChange={(event) => updateCategory(index, "trophyLogoAlignment", event.target.value)}>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              {[1, 2, 3].map((rank) => (
                <div className="field" key={rank}>
                  <label>Rank {rank} text override</label>
                  <input
                    value={category.podiumTextByRank?.[rank] || ""}
                    onChange={(event) => updatePodiumOverride(index, rank, event.target.value)}
                    placeholder={`Default ${rank}° text`}
                  />
                </div>
              ))}
            </div>

            <div className="form-grid" style={{ marginTop: 8 }}>
              {[1, 2, 3].map((rank) => {
                const defaultPreset = TROPHY_SIZE_PRESETS.find((p) => p.rank === rank) || TROPHY_SIZE_PRESETS[TROPHY_SIZE_PRESETS.length - 1];
                const currentW = category.trophyWidthCmByRank?.[rank];
                const currentH = category.trophyHeightCmByRank?.[rank];
                const currentVal = currentW && currentH ? `${currentW}x${currentH}` : "";
                return (
                  <div className="field" key={rank}>
                    <label>Rank {rank}° trophy size</label>
                    <select
                      value={currentVal}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (!val) {
                          updateTrophySizeForRank(index, rank, defaultPreset.widthCm, defaultPreset.heightCm);
                        } else {
                          const [w, h] = val.split("x").map(Number);
                          updateTrophySizeForRank(index, rank, w, h);
                        }
                      }}
                    >
                      {TROPHY_SIZE_PRESETS.map((preset) => (
                        <option key={preset.rank} value={`${preset.widthCm}x${preset.heightCm}`}>
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button className="btn btn-outline" onClick={addCategory}>
          + Add Category
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-number">{previewStats.participation}</div>
          <div className="stat-label">Participation</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{previewStats.categoryMedals}</div>
          <div className="stat-label">Category medals</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{previewStats.trophies}</div>
          <div className="stat-label">Trophies</div>
        </div>
      </div>

      <div className="gen-buttons">
        <button className="btn btn-gen" onClick={() => generate("participation")}>
          Generate participation
        </button>
        <button className="btn btn-gen" onClick={() => generate("category-medals")}>
          Generate category medals
        </button>
        <button className="btn btn-gen" onClick={() => generate("trophies")}>
          Generate trophies
        </button>
        <button className="btn btn-gen btn-gen-all" onClick={() => generate("all")}>
          Generate all
        </button>
      </div>

      {labels.length > 0 ? (
        <div id="preview-area" className="preview-section">
          <div className="preview-header">
            <h2>
              Preview - {labels.length} sticker{labels.length === 1 ? "" : "s"}
            </h2>
            <div className="preview-actions">
              <div className="sheet-size-row">
                <span className="sheet-size-label">Sheet:</span>
                <select className="sheet-size-select" value={sheetSizeKey} onChange={(event) => setSheetSizeKey(event.target.value)}>
                  {SHEET_SIZES.map((size) => (
                    <option key={size.key} value={size.key}>
                      {size.label}
                    </option>
                  ))}
                </select>
                {sheetSizeKey === "custom" ? (
                  <input className="sheet-size-input" type="number" min="80" value={customW} onChange={(event) => setCustomW(parseInt(event.target.value, 10) || 297)} />
                ) : null}
                <span className="sheet-size-label">Gap:</span>
                <input className="sheet-size-input" type="number" min="0" value={labelSpacingMm} onChange={(event) => setLabelSpacingMm(parseInt(event.target.value, 10) || 0)} />
              </div>
              <button className="btn btn-accent" onClick={handleDownloadSvg}>
                Download SVG
              </button>
              <button className="btn btn-outline" onClick={handlePrintPdf}>
                Export PDF
              </button>
            </div>
          </div>
          <div className="preview-area" ref={previewRef}>
            {labels.map((label) => (
              <div
                key={label.id}
                className="label-wrapper"
                data-export-item="true"
                data-break-group={label.group}
                data-break-value={label.breakValue || ""}
                data-label-id={label.id}
              >
                {renderLabel(label)}
                <div className="label-tag">{label.tag}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {showExcelModal ? (
        <div className="modal-overlay" onClick={() => setShowExcelModal(false)}>
          <div className="modal modal-lg" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Excel import</h2>
              <button className="modal-close" onClick={() => setShowExcelModal(false)}>
                x
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                {[
                  ["reference", "Reference"],
                  ["rowA", "Row A"],
                  ["rowB", "Row B"],
                  ["rowC", "Row C"],
                  ["medals", "Category medals"],
                  ["coppe", "Trophies"],
                  ["copiesPerRank", "Copies / rank"],
                  ["podiumText", "Podium text"],
                ].map(([key, label]) => (
                  <div className="field" key={key}>
                    <label>{label}</label>
                    <select value={colMap[key]} onChange={(event) => setColMap((prev) => ({ ...prev, [key]: event.target.value }))}>
                      <option value="">Do not use</option>
                      {excelHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowExcelModal(false)}>
                Cancel
              </button>
              <button className="btn btn-accent" onClick={applyExcelImport}>
                Import
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

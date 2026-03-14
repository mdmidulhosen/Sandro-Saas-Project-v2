import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { templatesApi } from '../utils/api';
import { useTranslation } from '../utils/i18n';

export default function Dashboard() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    templatesApi.getAll()
      .then(setTemplates)
      .catch(() => setError(t('dash_backend_error')))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const catLabel = (n) => n === 1 ? t('dash_cat_single') : t('dash_cat_plural');

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{t('dash_title')}</h1>
          <p className="subtitle">{t('dash_subtitle')}</p>
        </div>
      </div>

      {error && <div className="alert alert-warn">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{loading ? '…' : templates.length}</div>
          <div className="stat-label">{t('dash_saved_templates')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">3</div>
          <div className="stat-label">{t('dash_label_types')}</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-number">SVG</div>
          <div className="stat-label">{t('dash_vector_export')}</div>
        </div>
      </div>

      <div className="action-cards">
        <Link to="/generator" className="action-card primary">
          <div className="action-icon">⚡</div>
          <div className="action-title">{t('dash_generate')}</div>
          <div className="action-desc">{t('dash_generate_desc')}</div>
        </Link>
        <Link to="/templates" className="action-card">
          <div className="action-icon">📋</div>
          <div className="action-title">{t('dash_manage_templates')}</div>
          <div className="action-desc">{t('dash_manage_desc')}</div>
        </Link>
      </div>

      {!loading && !error && templates.length > 0 && (
        <div className="section">
          <h2>{t('dash_available_templates')}</h2>
          <div className="template-list">
            {templates.map(t2 => {
              const n = t2.categories?.length || 0;
              const participation = t2.participationCount > 0 ? 'participation' : 'no participation';
              return (
                <div key={t2.id} className="template-card">
                  <div className="template-card-body">
                    <div className="template-name">{t2.name}</div>
                    <div className="template-desc">{t2.description}</div>
                    <div className="template-meta">
                      {n} {catLabel(n)} · {participation} · {t2.podiumPreset || t2.podioMode || 'class'}
                    </div>
                  </div>
                  <div className="template-card-actions">
                    <Link to={`/generator?template=${t2.id}`} className="btn btn-sm btn-accent">
                      {t('dash_use_template')}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="section info-box">
        <h3>{t('dash_how_title')}</h3>
        <ol className="how-list">
          {['dash_how_1','dash_how_2','dash_how_3','dash_how_4','dash_how_5'].map(key => (
            <li key={key} dangerouslySetInnerHTML={{ __html: t(key) }} />
          ))}
        </ol>
      </div>
    </div>
  );
}

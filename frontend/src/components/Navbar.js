import { NavLink } from 'react-router-dom';
import { useTranslation } from '../utils/i18n';
import './Navbar.css';

export default function Navbar() {
  const { t, lang, switchLang } = useTranslation();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🏆</span>
        <span className="brand-name">SF Etichette PRO</span>
      </div>

      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          {t('nav_dashboard')}
        </NavLink>
        <NavLink to="/templates" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          {t('nav_templates')}
        </NavLink>
        <NavLink to="/generator" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          {t('nav_generator')}
        </NavLink>
      </div>

      {/* Language toggle */}
      <div className="lang-toggle">
        <button
          className={'lang-btn' + (lang === 'it' ? ' active' : '')}
          onClick={() => switchLang('it')}
          title="Italiano"
        >
          🇮🇹 IT
        </button>
        <button
          className={'lang-btn' + (lang === 'en' ? ' active' : '')}
          onClick={() => switchLang('en')}
          title="English"
        >
          🇬🇧 EN
        </button>
      </div>

      <div className="navbar-version">v1.0.0</div>
    </nav>
  );
}

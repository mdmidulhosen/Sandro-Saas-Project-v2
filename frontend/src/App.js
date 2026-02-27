import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './utils/i18n';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TemplatesPage from './pages/TemplatesPage';
import GeneratorPage from './pages/GeneratorPage';
import './App.css';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/generator" element={<GeneratorPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

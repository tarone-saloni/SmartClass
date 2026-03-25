import { useEffect } from 'react';

export const themeStyles = {
  light: {
    '--bg': '#f8fafc',
    '--surface': '#ffffff',
    '--text': '#0f172a',
    '--muted': '#475569',
    '--accent': '#2563eb',
    '--accent-contrast': '#ffffff',
    '--border': '#e2e8f0',
    className: ''
  },
  dark: {
    '--bg': '#0f172a',
    '--surface': '#111827',
    '--text': '#e2e8f0',
    '--muted': '#94a3b8',
    '--accent': '#38bdf8',
    '--accent-contrast': '#0f172a',
    '--border': '#1f2937',
    className: 'dark'
  },
  custom: {
    '--bg': '#0b1221',
    '--surface': '#0f1a2f',
    '--text': '#e0e7ff',
    '--muted': '#9fb3ff',
    '--accent': '#7c3aed',
    '--accent-contrast': '#f8fafc',
    '--border': '#1e293b',
    className: 'custom-theme'
  }
};

function ThemeApplier({ themeName }) {
  useEffect(() => {
    const current = themeStyles[themeName] || themeStyles.light;
    Object.entries(current).forEach(([key, value]) => {
      if (key.startsWith('--')) document.documentElement.style.setProperty(key, value);
    });
    document.documentElement.classList.remove('dark', 'custom-theme');
    if (current.className) document.documentElement.classList.add(current.className);
    localStorage.setItem('smartclass_theme', themeName);
  }, [themeName]);

  return null;
}

export default ThemeApplier;
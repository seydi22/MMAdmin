export const THEMES = [
  { id: 'clair', label: 'Clair' },
  { id: 'sombre', label: 'Sombre' },
  { id: 'yeux', label: 'Yeux' },
];

const STORAGE_KEY = 'pnam-theme';

export function readTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((item) => item.id === value)) return value;
  } catch (err) {
    return 'clair';
  }
  return 'clair';
}

export function applyTheme(id) {
  const theme = THEMES.some((item) => item.id === id) ? id : 'clair';
  if (theme === 'clair') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (err) {
    /* affichage local uniquement */
  }
  window.dispatchEvent(new Event('pnam-theme'));
  const color = theme === 'sombre' ? '#10161d' : theme === 'yeux' ? '#f4ecd8' : '#005BAC';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

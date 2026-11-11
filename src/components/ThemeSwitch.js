import React, { useEffect, useState } from 'react';
import { applyTheme, readTheme, THEMES } from '../utils/theme';

const HINT = {
  clair: 'Affichage clair',
  sombre: 'Affichage sombre',
  yeux: 'Protection des yeux, fond chaud et moins de bleu',
};

const ThemeSwitch = () => {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    window.addEventListener('pnam-theme', sync);
    return () => window.removeEventListener('pnam-theme', sync);
  }, []);

  return (
    <div className="theme-switch" role="radiogroup" aria-label="Mode d'affichage">
      {THEMES.map((item) => (
        <button
          key={item.id}
          type="button"
          role="radio"
          aria-checked={theme === item.id}
          title={HINT[item.id]}
          className={theme === item.id ? 'is-active' : ''}
          onClick={() => applyTheme(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitch;

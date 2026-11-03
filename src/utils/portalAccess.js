export const DASHBOARD_BLOCS = [
  'dashboard-organisation',
  'dashboard-marchands',
  'dashboard-alertes',
  'dashboard-activite',
];

export function voirDashboard(key) {
  const role = localStorage.getItem('userRole');
  if (role === 'admin') return true;
  if (role !== 'backoffice' || !canSee('dashboard')) return false;
  const keys = readHabilitations();
  if (!keys.includes('dashboard-choix')) return true;
  return keys.includes(key);
}

export const PORTAL_MENU = [
  { key: 'dashboard', label: 'Dashboard', path: '/' },
  { key: 'parametres', label: 'Paramètres', path: '/settings' },
  { key: 'organisation', label: 'Organisation', path: '/organisation' },
  { key: 'referentiel-kyc', label: 'Référentiel KYC', path: '/referentiel-kyc' },
  { key: 'referentiel-geo', label: 'Référentiel géographique', path: '/referentiel-geo' },
  { key: 'pointage', label: 'Pointage', path: '/pointage' },
  { key: 'materiel', label: 'Matériel', path: '/materiel' },
  { key: 'marchands', label: 'Marchands', path: '/merchants' },
  { key: 'carte-marchand', label: 'Carte marchand', path: '/carte' },
  { key: 'carte-equipe', label: 'Carte équipe', path: '/carte-equipe' },
  { key: 'anti-fraude', label: 'Anti-fraude', path: '/anti-fraude' },
  { key: 'validation', label: 'Validation Marchands', path: '/merchants/pending-validation' },
  { key: 'rapports', label: 'Rapports', path: '/reports' },
];

export function readHabilitations() {
  try {
    const parsed = JSON.parse(localStorage.getItem('habilitations') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

export function canSee(key) {
  const role = localStorage.getItem('userRole');
  if (role === 'logisticien') return key === 'stock';
  if (role === 'admin') return true;
  if (role !== 'backoffice') return false;
  return readHabilitations().includes(key);
}

export function firstPortalPath() {
  const role = localStorage.getItem('userRole');
  if (role === 'logisticien') return '/stock';
  if (role === 'admin') return '/';
  const next = PORTAL_MENU.find((item) => readHabilitations().includes(item.key));
  return next ? next.path : '/aucune-habilitation';
}

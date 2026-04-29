/** Statut API : enrôlement verrouillé (aucune validation / rejet / édition ultérieure). */
export const STATUT_REJETE_DEFINITIF = 'rejeté_définitivement';

const STATUTS_ADMIN_REJET_DEFINITIF = new Set([
  'en attente',
  'validé_par_superviseur',
  'rejeté',
]);

const LABELS_PAR_STATUT_NORMALISE = {
  validé_par_superviseur: 'Validé par superviseur',
  cree: 'Créé',
};

export function formatMerchantStatutLabel(statut) {
  if (!statut) return '';
  if (statut === STATUT_REJETE_DEFINITIF) return 'Rejeté définitivement';
  const key = String(statut).trim().toLowerCase();
  if (LABELS_PAR_STATUT_NORMALISE[key]) return LABELS_PAR_STATUT_NORMALISE[key];
  return statut;
}

export function isMerchantLockedDefinitive(statut) {
  if (!statut) return false;
  return String(statut).trim().toLowerCase() === STATUT_REJETE_DEFINITIF.toLowerCase();
}

/** L’admin peut appeler POST admin-reject-definitive (hors dossiers déjà validés / livrés / verrouillés). */
export function canAdminRejectDefinitive(statut) {
  if (!statut || isMerchantLockedDefinitive(statut)) return false;
  const normalized = String(statut).trim().toLowerCase();
  return STATUTS_ADMIN_REJET_DEFINITIF.has(normalized);
}

/** Suffixe stable pour classes CSS (évite les sélecteurs fragiles sur accents). */
export function statusBadgeCssSuffix(statut) {
  if (!statut) return 'default';
  if (statut === STATUT_REJETE_DEFINITIF) return 'rejete_definitif';
  return String(statut).replace(/\s+/g, '_');
}

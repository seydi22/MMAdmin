/** Statut API : enrôlement verrouillé (aucune validation / rejet / édition ultérieure). */
export const STATUT_REJETE_DEFINITIF = 'rejeté_définitivement';

const STATUTS_ADMIN_REJET_DEFINITIF = new Set([
  'en attente',
  'validé_par_superviseur',
  'rejeté',
]);

export function formatMerchantStatutLabel(statut) {
  if (statut === STATUT_REJETE_DEFINITIF) return 'Rejeté définitivement';
  return statut ?? '';
}

export function isMerchantLockedDefinitive(statut) {
  return statut === STATUT_REJETE_DEFINITIF;
}

/** L’admin peut appeler POST admin-reject-definitive (hors dossiers déjà validés / livrés / verrouillés). */
export function canAdminRejectDefinitive(statut) {
  if (!statut || isMerchantLockedDefinitive(statut)) return false;
  return STATUTS_ADMIN_REJET_DEFINITIF.has(statut);
}

/** Suffixe stable pour classes CSS (évite les sélecteurs fragiles sur accents). */
export function statusBadgeCssSuffix(statut) {
  if (!statut) return 'default';
  if (statut === STATUT_REJETE_DEFINITIF) return 'rejete_definitif';
  return String(statut).replace(/\s+/g, '_');
}

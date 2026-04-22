/**
 * Affiche l’agent d’enrôlement (prénom + nom + matricule) quand l’objet est peuplé côté API.
 * @param {object|null|undefined} agent
 * @returns {string|null} null si pas assez d’infos
 */
export function formatRecruiterLabel(agent) {
  if (!agent || typeof agent !== 'object') return null;
  const prenom = typeof agent.prenom === 'string' ? agent.prenom.trim() : '';
  const nom = typeof agent.nom === 'string' ? agent.nom.trim() : '';
  const fullName = [prenom, nom].filter(Boolean).join(' ').trim();
  const mat = typeof agent.matricule === 'string' ? agent.matricule.trim() : '';
  if (fullName && mat) return `${fullName} (${mat})`;
  if (fullName) return fullName;
  if (mat) return mat;
  return null;
}

/**
 * @param {string|object|undefined|null} ref — ObjectId, ou { _id, nom, matricule, ... }
 * @returns {string|null}
 */
export function getAgentIdFromRecruiterRef(ref) {
  if (ref == null) return null;
  if (typeof ref === 'string') return ref;
  if (typeof ref === 'object' && ref._id != null) return String(ref._id);
  return null;
}

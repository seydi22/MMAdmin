function digitsOnly(raw) {
  return String(raw == null ? '' : raw).replace(/\D/g, '');
}

export function nniDigits(raw) {
  return digitsOnly(raw).slice(0, 10);
}

export function isNni(raw) {
  return /^\d{10}$/.test(nniDigits(raw));
}

export function localMsisdn(raw) {
  let digits = digitsOnly(raw);
  if (digits.startsWith('00222')) digits = digits.slice(5);
  else if (digits.startsWith('222')) digits = digits.slice(3);
  return digits.slice(0, 8);
}

export function isLocalMsisdn(raw) {
  return /^4\d{7}$/.test(localMsisdn(raw));
}

export function backendMsisdn(raw) {
  const local = localMsisdn(raw);
  return /^4\d{7}$/.test(local) ? `222${local}` : '';
}

export function formatMsisdn(raw) {
  const local = localMsisdn(raw);
  if (/^4\d{7}$/.test(local)) return `+222 ${local}`;
  const leftover = digitsOnly(raw);
  return leftover || '—';
}

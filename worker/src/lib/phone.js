// Ukrainian mobile format: +380XXXXXXXXX (9 digits after 380)
const UA_PHONE_RE = /^\+380\d{9}$/;

export function isValidUaPhone(phone) {
  return typeof phone === 'string' && UA_PHONE_RE.test(phone.trim());
}

export function normalizeUaPhone(phone) {
  let p = phone.trim().replace(/[\s()-]/g, '');
  if (p.startsWith('0')) p = '+38' + p;
  if (p.startsWith('380')) p = '+' + p;
  return p;
}

const UA_PHONE_RE = /^\+380\d{9}$/;

export function isValidUaPhone(phone) {
  return typeof phone === 'string' && UA_PHONE_RE.test(phone.trim());
}

// Best-effort formatting as the user types: keeps a leading +380 and digits only.
export function formatUaPhoneInput(raw) {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('380')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  digits = digits.slice(0, 9);
  return `+380${digits}`;
}

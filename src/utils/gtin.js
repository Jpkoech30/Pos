export function cleanGtin(input) {
  return String(input ?? '').replace(/\D/g, '');
}

export function isValidGtin(input) {
  const digits = cleanGtin(input);
  if (![8, 12, 13, 14].includes(digits.length)) return false;
  const payload = digits.slice(0, -1);
  const provided = Number(digits.slice(-1));
  let sum = 0;
  let weight = 3;
  for (let i = payload.length - 1; i >= 0; i--) {
    sum += Number(payload[i]) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return ((10 - (sum % 10)) % 10) === provided;
}

export function gtinSymbology(input) {
  const digits = cleanGtin(input);
  switch (digits.length) {
    case 8:  return 'EAN-8';
    case 12: return 'UPC-A';
    case 13: return 'EAN-13';
    case 14: return 'ITF-14';
    default: return null;
  }
}
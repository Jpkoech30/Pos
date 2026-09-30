/**
 * Format a number as Kenyan Shillings.
 *   formatKES(250)     → "KSh 250"
 *   formatKES(1234.5)  → "KSh 1,234.50"
 *   formatKES(0)       → "KSh 0"
 */
export function formatKES(amount) {
  const n = Number(amount) || 0;
  const hasCents = Math.round(n * 100) % 100 !== 0;

  return `KSh ${n.toLocaleString('en-KE', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
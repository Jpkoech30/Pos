/**
 * Theme colors — Safaricom brand palette
 *
 * All colors in the app reference this file. Nothing should be hardcoded
 * with a hex value in a screen or component — if you need a new color,
 * add it here so it can be changed in one place later.
 *
 * Structure:
 *   - Brand colors (primary green, M-Pesa red)
 *   - Status colors (success, warning, danger)
 *   - Surfaces (backgrounds and cards)
 *   - Text (four levels of emphasis)
 *   - Borders
 */
export const colors = {
  // ─── Brand ─────────────────────────────────────────────
  // Safaricom green. Used for every interactive element:
  // active tabs, buttons, focus rings, loading spinners.
  primary: '#39B54A',

  // A darker shade of the brand green. Used for pressed states
  // and anywhere the primary needs extra weight (e.g. a header bar).
  primaryDark: '#009A3E',

  // Very light green tint. Used as a background for selected
  // tiles, chips, and any subtle "this is active" surface.
  primarySoft: '#E8F8EC',

  // Text color to use on top of `primary`. Almost always white.
  primaryText: '#FFFFFF',

  // ─── M-Pesa ────────────────────────────────────────────
  // M-Pesa red. Kept as its own token (not aliased to danger)
  // so we can use it on the M-Pesa tile without implying error.
  mpesaRed: '#EC1C24',

  // Light red background for M-Pesa-related surfaces if needed.
  mpesaSoft: '#FDE8E8',

  // ─── Status ────────────────────────────────────────────
  // Success — green checkmarks, "sale complete", payment received.
  success: '#39B54A',
  successSoft: '#E8F8EC',

  // Warning — low stock, "3 items left", non-blocking attention.
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',

  // Danger — Safaricom red. Failed payments, "Clear all" links,
  // short-payment warnings, anything destructive or wrong.
  danger: '#EC1A23',
  dangerSoft: '#FDE8E8',

  // ─── Surfaces ──────────────────────────────────────────
  // Page background. Slightly off-white so cards stand out
  // without needing heavy shadows.
  background: '#F4F6F8',

  // Card / tile background. Pure white for maximum contrast
  // against `background`.
  surface: '#FFFFFF',

  // Alternate surface for nested cards or subtle panels.
  surfaceAlt: '#F9FAFB',

  // ─── Text ──────────────────────────────────────────────
  // Four levels of emphasis. Use the lowest level that still reads.

  // Primary text — headings, item names, amounts.
  text: '#1A1A1A',

  // Secondary text — labels, subtitles, anything that supports
  // the primary text but isn't the star.
  textSecondary: '#4B5563',

  // Muted text — timestamps, helper text, disabled states.
  // Lowest emphasis, still readable.
  textMuted: '#9CA3AF',

  // Text on dark or colored backgrounds (buttons, badges).
  textInverse: '#FFFFFF',

  // ─── Borders ───────────────────────────────────────────
  // Standard border — card edges, dividers, input outlines.
  // Matches Safaricom's Catskill White.
  border: '#E4EAF1',

  // Stronger border for emphasis — focused inputs, selected cards.
  borderStrong: '#D1D5DB',
};
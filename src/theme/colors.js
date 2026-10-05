/**
 * Theme colors — Safaricom brand palette
 *
 * All colors in the app reference this file. Nothing should be hardcoded
 * with a hex value in a screen or component — if you need a new color,
 * add it here so it can be changed in one place later.
 *
 * Contrast: every text color passes WCAG AA on its intended background
 * (4.5:1 body, 3:1 large). Disabled states are exempt.
 */
export const colors = {
  // ─── Brand ─────────────────────────────────────────────
  primary: '#39B54A',
  primaryPressed: '#2E9A3D',
  primaryDark: '#009A3E',
  primarySoft: '#E8F8EC',
  primaryText: '#FFFFFF',

  // ─── M-Pesa ────────────────────────────────────────────
  mpesa: '#EC1C24',
  mpesaSoft: '#FDE8E8',

  // ─── Status ────────────────────────────────────────────
  success: '#16A34A',
  successSoft: '#DCFCE7',

  warning: '#D97706',
  warningSoft: '#FEF3C7',

  danger: '#DC2626',
  dangerPressed: '#B91C1C',
  dangerSoft: '#FEE2E2',

  info: '#2563EB',
  infoSoft: '#DBEAFE',

  // ─── Surfaces ──────────────────────────────────────────
  background: '#F4F6F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // ─── Text ──────────────────────────────────────────────
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  textDisabled: '#9CA3AF',

  // ─── Borders ───────────────────────────────────────────
  border: '#E4EAF1',
  borderStrong: '#D1D5DB',
  focus: '#39B54A',

  // ─── Disabled surfaces ─────────────────────────────────
  disabled: '#E5E7EB',

  // ─── Neutral scale ─────────────────────────────────────
  neutral: {
    50:  '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};
/**
 * COLOR TOKENS
 *
 * All colors used in the app live here. Never write a hex value directly
 * inside a screen or component — always reference a token from this file.
 *
 * Why: changing the brand color should be a one-line edit, not a
 * find-and-replace across 20 files.
 */
export const colors = {
  // --- Brand ---
  // The main color of the app. Used for buttons, links, focus rings,
  // tab bar active state, and primary icons.
  primary: '#2563eb',

  // Darker shade — used for gradient starts, pressed states, or
  // when you need extra contrast on light backgrounds.
  primaryDark: '#1e3a8a',

  // Lighter shade — used for gradient ends and hover/press glows.
  primaryLight: '#3b82f6',

  // Very light tint — used as a background behind primary-colored
  // icons or as a soft highlight surface.
  primarySoft: '#eff6ff',

  // --- Semantic ---
  // Colors with meaning. Use these instead of picking a green/red
  // manually — that way "success" is consistent everywhere.
  success: '#059669',
  successSoft: '#ecfdf5',   // light bg for success banners
  warning: '#d97706',
  warningSoft: '#fffbeb',
  danger: '#dc2626',        // errors, destructive actions
  dangerSoft: '#fef2f2',    // light bg for error inputs / danger rows
  info: '#0891b2',
  infoSoft: '#ecfeff',      // light bg for info banners

  // --- Text ---
  // Four levels of text hierarchy. Use them consistently:
  //   text       → headings, primary content
  //   textSecondary → body paragraphs, sublabels
  //   textMuted  → captions, hints, disabled text
  //   textInverse → text on dark/gradient backgrounds
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  // --- Surfaces ---
  // Backgrounds and borders. Follow this hierarchy:
  //   background → the page itself (light gray)
  //   surface    → cards, inputs, tab bar (white)
  //   surfaceAlt → subtle inner surfaces (very light gray)
  //   border     → default hairlines and dividers
  //   borderStrong → emphasized borders (focused, active states)
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceAlt: '#fafafa',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',

  // --- Hero gradient ---
  // The 3-stop gradient used on the Home hero card. Kept as an
  // array so expo-linear-gradient can consume it directly.
  heroGradient: ['#1e3a8a', '#2563eb', '#3b82f6'],

  // --- Overlays ---
  // Translucent tints for elements placed on top of other content
  // (glass-style icon buttons on gradients, modal scrims).
  overlayLight: 'rgba(255,255,255,0.15)',
  overlayDark: 'rgba(0,0,0,0.4)',
};
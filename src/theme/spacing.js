/**
 * SPACING TOKENS
 *
 * Every gap, padding, and margin in the app should come from here.
 * The scale is a multiple-of-4 system — that's what keeps layouts
 * feeling visually aligned without extra effort.
 *
 * Never write `padding: 16`. Write `padding: spacing.lg`. Then if
 * the whole app needs more breathing room, you change one number
 * and every screen updates.
 */
export const spacing = {
  // Base scale — use these directly for ad-hoc values.
  xs: 4,    // tiny gaps (icon-to-text inside a pill)
  sm: 8,    // small gaps (between a label and its input)
  md: 12,   // medium gaps (between rows inside a card)
  lg: 16,   // default padding (card padding, button padding)
  xl: 20,   // slightly larger gap (between cards)
  xxl: 24,  // section separation (between major blocks)
  xxxl: 32, // big separation (screen top padding)
  huge: 48, // rarely used — for hero spacing

  // Semantic shortcuts — use these when the *intent* matters more
  // than the pixel value. Changing these rescales the whole app.
  screenPadding: 20,   // horizontal padding for screen content
  cardPadding: 16,     // default inner padding for cards
  sectionGap: 24,      // vertical gap between top-level sections
};
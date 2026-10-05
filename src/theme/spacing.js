/**
 * Spacing tokens — 4-based scale.
 *
 * Never write `padding: 16`. Write `padding: spacing.lg`.
 */
export const spacing = {
  hairline: 2, // below-text micro gap
  xs: 4,       // tiny gaps
  sm: 8,       // small gaps
  md: 12,      // medium gaps
  lg: 16,      // default padding
  xl: 20,      // larger gap
  xxl: 24,     // section separation
  xxxl: 32,    // big separation
  huge: 48,    // hero spacing
};

// Semantic aliases — derived from the scale so they never drift.
spacing.screenPadding = spacing.xl;
spacing.cardPadding   = spacing.lg;
spacing.sectionGap    = spacing.xxl;
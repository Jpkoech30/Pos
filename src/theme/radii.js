/**
 * RADIUS TOKENS
 *
 * Corner rounding values. Consistency here is subtle but real —
 * if buttons have radius 8 and cards have radius 10, the whole
 * layout feels "off" without anyone being able to say why.
 *
 * Rule of thumb: the bigger the surface, the larger its radius.
 */
export const radii = {
  xs: 6,   // chips, tags
  sm: 8,   // small buttons, small inputs
  md: 12,  // default buttons, inputs
  lg: 16,  // cards
  xl: 20,  // large cards, modals
  xxl: 28, // hero cards, bottom sheets
  pill: 999, // fully rounded (avatars, pills, circular icon buttons)
};
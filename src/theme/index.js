/**
 * THEME INDEX
 *
 * Single entry point for every design token. Screens and components
 * import from '../theme' — never from individual files. That way,
 * if we ever restructure the theme folder, no screen has to change.
 *
 * Usage:
 *   import { colors, spacing, typography, radii, shadows } from '../theme';
 */
export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';
export { radii } from './radii';
export { shadows } from './shadows';
export { commonStyles } from './commonStyles';
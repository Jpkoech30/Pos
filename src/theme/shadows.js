/**
 * SHADOW TOKENS
 *
 * Cross-platform shadow helper. iOS and Android handle shadows
 * completely differently:
 *   - iOS uses shadowColor / shadowOffset / shadowOpacity / shadowRadius
 *   - Android uses `elevation` (a single number)
 *
 * This module abstracts that so you just pick a level (sm/md/lg/xl)
 * and it renders correctly on both platforms.
 *
 * Usage:
 *   const styles = StyleSheet.create({
 *     card: { ...shadows.md, backgroundColor: colors.surface },
 *   });
 */
import { Platform } from 'react-native';

const createShadow = ({ y, blur, opacity, elevation }) => {
  if (Platform.OS === 'android') return { elevation };
  return {
    shadowColor: '#0f172a',       // dark navy rather than pure black
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
};

export const shadows = {
  none: {},  // use to explicitly remove a shadow in an override

  // Subtle — cards, inputs, list rows. Barely visible, just enough
  // to lift the surface off the background.
  sm: createShadow({ y: 1, blur: 4, opacity: 0.05, elevation: 1 }),

  // Default — most interactive surfaces (buttons, small cards).
  md: createShadow({ y: 2, blur: 8, opacity: 0.06, elevation: 2 }),

  // Pronounced — modals, dropdowns, floating action buttons.
  lg: createShadow({ y: 4, blur: 16, opacity: 0.08, elevation: 4 }),

  // Heavy — full-screen sheets, tooltips that must dominate.
  xl: createShadow({ y: 8, blur: 24, opacity: 0.1, elevation: 8 }),
};
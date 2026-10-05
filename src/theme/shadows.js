/**
 * Cross-platform shadow tokens.
 *
 * iOS uses shadow props; Android uses elevation. Pair with a border on
 * Android if you need extra definition — elevation is structurally weaker.
 * `overflow: 'hidden'` kills the Android shadow entirely.
 */
import { Platform } from 'react-native';

const SHADOW_COLOR = '#0f172a';

const createShadow = ({ y, blur, opacity, elevation }) => {
  if (Platform.OS === 'android') return { elevation };
  return {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
};

export const shadows = {
  none: Platform.OS === 'android'
    ? { elevation: 0 }
    : {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },

  sm: createShadow({ y: 1, blur: 4,  opacity: 0.08, elevation: 1 }),
  md: createShadow({ y: 2, blur: 8,  opacity: 0.10, elevation: 2 }),
  lg: createShadow({ y: 4, blur: 16, opacity: 0.14, elevation: 4 }),
  xl: createShadow({ y: 8, blur: 24, opacity: 0.18, elevation: 8 }),
};
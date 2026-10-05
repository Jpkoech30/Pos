/**
 * Typography tokens
 *
 * Every token declares lineHeight explicitly — Android and iOS default
 * to different line heights otherwise. Weight comes from `weights`
 * constants, never a raw string.
 */
export const weights = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  heavy:    '800',
};

const family = undefined; // set to 'Inter' etc. if you ship a custom font

export const typography = {
  display: {
    fontFamily: family,
    fontSize: 38, lineHeight: 44,
    fontWeight: weights.heavy, letterSpacing: -0.6,
  },

  h1: {
    fontFamily: family,
    fontSize: 30, lineHeight: 36,
    fontWeight: weights.bold, letterSpacing: -0.4,
  },
  h2: {
    fontFamily: family,
    fontSize: 22, lineHeight: 28,
    fontWeight: weights.bold, letterSpacing: -0.2,
  },
  h3: {
    fontFamily: family,
    fontSize: 18, lineHeight: 24,
    fontWeight: weights.semibold, letterSpacing: -0.1,
  },
  h4: {
    fontFamily: family,
    fontSize: 16, lineHeight: 22,
    fontWeight: weights.semibold,
  },

  body: {
    fontFamily: family,
    fontSize: 15, lineHeight: 22,
    fontWeight: weights.regular,
  },
  bodyMedium: {
    fontFamily: family,
    fontSize: 15, lineHeight: 22,
    fontWeight: weights.medium,
  },
  bodyBold: {
    fontFamily: family,
    fontSize: 15, lineHeight: 22,
    fontWeight: weights.semibold,
  },

  caption: {
    fontFamily: family,
    fontSize: 13, lineHeight: 18,
    fontWeight: weights.regular,
  },
  captionMedium: {
    fontFamily: family,
    fontSize: 13, lineHeight: 18,
    fontWeight: weights.medium,
  },

  tiny: {
    fontFamily: family,
    fontSize: 11, lineHeight: 14,
    fontWeight: weights.semibold, letterSpacing: 0.3,
  },

  overline: {
    fontFamily: family,
    fontSize: 11, lineHeight: 14,
    fontWeight: weights.bold, letterSpacing: 0.8,
  },

  button: {
    fontFamily: family,
    fontSize: 16, lineHeight: 20,
    fontWeight: weights.semibold, letterSpacing: 0.1,
  },
  buttonLarge: {
    fontFamily: family,
    fontSize: 17, lineHeight: 22,
    fontWeight: weights.bold, letterSpacing: 0.1,
  },
  buttonSmall: {
    fontFamily: family,
    fontSize: 14, lineHeight: 18,
    fontWeight: weights.semibold, letterSpacing: 0.1,
  },

  price: {
    fontFamily: family,
    fontSize: 16, lineHeight: 20,
    fontWeight: weights.bold,
    fontVariant: ['tabular-nums'],
  },
  priceLarge: {
    fontFamily: family,
    fontSize: 28, lineHeight: 32,
    fontWeight: weights.heavy, letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  },
};
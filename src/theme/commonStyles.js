/**
 * COMMON STYLE PRESETS
 *
 * Layer 2 of the design system. Built on top of tokens (Layer 1)
 * to eliminate the boilerplate that every screen otherwise repeats.
 *
 * Think of these as *mini components without JSX* — named style
 * recipes you can drop into any element with one line.
 *
 * Where to use these:
 *   - Layout wrappers (screen, center, row)
 *   - Frequently repeated surfaces (card, footer)
 *   - Text presets tied to a semantic role (textTitle, textMuted)
 *
 * Where NOT to use these:
 *   - Anything that needs to be tappable → use a real component
 *   - Complex one-offs → write an inline StyleSheet rule
 *   - Design decisions specific to one screen → keep them local
 *
 * Rule of thumb: if you write the same 3+ style properties twice
 * across screens, it belongs here.
 */
import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radii } from './radii';
import { shadows } from './shadows';

export const commonStyles = StyleSheet.create({
  // ─────────────────────────────────────────────────────────────
  // LAYOUT CONTAINERS
  // Wrappers for screens, rows, and centering. These are the most
  // frequently reused because they appear in nearly every screen.
  // ─────────────────────────────────────────────────────────────

  // Full-height page with the standard background color.
  // Use when the screen's own content handles its padding.
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Same as `screen`, but with the standard horizontal & vertical
  // padding already applied. Use for simple content pages.
  screenPadded: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.screenPadding,
  },

  // Centers a single child both horizontally and vertically.
  // Perfect for loading spinners, empty states, and error screens.
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // Horizontal flex row with vertically centered children.
  // The most common inline layout primitive — used in list rows,
  // headers with icons, avatar + text combos.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Same as `row`, but children are pushed to opposite ends.
  // For "label on left, value on right" or "title + action button".
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Vertical stack — explicit for when you want to name the intent.
  // (View defaults to column, but being explicit reads better in JSX.)
  col: {
    flexDirection: 'column',
  },

  // ─────────────────────────────────────────────────────────────
  // SURFACES (cards & panels)
  // White backgrounds that sit on top of the page background.
  // Two flavors: standard (compact) and spacious (hero/promotional).
  // ─────────────────────────────────────────────────────────────

  // Standard card — used for list items, form groups, info panels.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },

  // Bigger, softer card — used for hero panels, profile headers,
  // anything that should feel like the "main" element on screen.
  cardSpacious: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    ...shadows.md,
  },

  // Card with no padding — for list groups where each row manages
  // its own internal padding and dividers.
  cardFlat: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },

  // ─────────────────────────────────────────────────────────────
  // FOOTER
  // The pinned action area at the bottom of form screens.
  // Gives the primary button a solid ground and a visual break
  // from the scrolling content above.
  // ─────────────────────────────────────────────────────────────

  footer: {
    padding: spacing.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },

  // ─────────────────────────────────────────────────────────────
  // DIVIDERS
  // Hairlines between rows. Two variants:
  //   - divider      → full width
  //   - dividerInset → indented to align with row text
  //                    (skip icon + its margin on the left)
  // ─────────────────────────────────────────────────────────────

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  dividerInset: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md, // rowPad + icon + gap
  },

  // ─────────────────────────────────────────────────────────────
  // TEXT PRESETS
  // Named roles for text. Spread these into a StyleSheet rule,
  // then override `color` or add margins as needed.
  //
  // Usage:
  //   title: { ...commonStyles.textTitle, color: colors.text }
  // ─────────────────────────────────────────────────────────────

  // Hero numerals — the total balance on the Home screen.
  textDisplay: { ...typography.display, color: colors.text },

  // Screen titles — "Welcome Back", "Profile", "Create Account".
  textTitle: { ...typography.h1, color: colors.text },

  // Section titles inside a screen.
  textSection: { ...typography.h3, color: colors.text },

  // Default body text — paragraph content, descriptions.
  textBody: { ...typography.body, color: colors.text },

  // Body text with reduced emphasis — sublabels under a title.
  textBodyMuted: { ...typography.body, color: colors.textSecondary },

  // Small descriptive text — hints, sublabels, supporting copy.
  textCaption: { ...typography.caption, color: colors.textSecondary },

  // Faintest text — timestamps, version numbers, empty-state hints.
  textMuted: { ...typography.caption, color: colors.textMuted },

  // Section header — small uppercase label above groups of content.
  // Used above cards in the Profile screen, above lists, etc.
  textSectionLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // Links and inline actions.
  textLink: { ...typography.bodyMedium, color: colors.primary },

  // Error message text shown beneath inputs.
  textError: { ...typography.caption, color: colors.danger },

  // Text placed on a dark/gradient background.
  textInverse: { ...typography.body, color: colors.textInverse },

  // ─────────────────────────────────────────────────────────────
  // SPACING HELPERS
  // Named spacing presets for common layouts. Prefer these over
  // raw `marginTop: spacing.xxl` so intent stays readable.
  // ─────────────────────────────────────────────────────────────

  // Vertical gap between major sections of a screen.
  sectionGap: { marginBottom: spacing.xxl },

  // A little extra breathing room under a heading.
  headingGap: { marginBottom: spacing.lg },

  // Used to push a footer button group down when content is short.
  pushDown: { marginTop: spacing.xxl },
});
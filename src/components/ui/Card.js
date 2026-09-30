/**
 * <Card>
 *
 * White rounded surface with a soft shadow. Variants:
 *   - default   compact padding, radius lg   → form groups, list items
 *   - spacious  larger padding, radius xl    → hero panels, profile headers
 *   - flat      no padding                   → row groups with own dividers
 *
 * Props:
 *   variant  {'default'|'spacious'|'flat'}
 *   padded   {boolean}  Override padding (default true)
 *   style    {object}   Extra style
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radii, shadows } from '../../theme';

export default function Card({
  children,
  variant = 'default',
  padded = true,
  style,
}) {
  return (
    <View
      style={[
        styles.base,
        variant === 'spacious' && styles.spacious,
        variant === 'flat' && styles.flat,
        padded && variant !== 'flat' && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  spacious: {
    borderRadius: radii.xl,
    ...shadows.md,
  },
  flat: {
    overflow: 'hidden',
  },
  padded: {
    padding: spacing.lg,
  },
});
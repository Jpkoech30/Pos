/**
 * <Divider>
 *
 * Thin horizontal hairline. Two variants:
 *   - default  full width of the parent
 *   - inset    indented to align with row text (skips icon column)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export default function Divider({ inset = false, style }) {
  return <View style={[styles.base, inset && styles.inset, style]} />;
}

const styles = StyleSheet.create({
  base: { height: 1, backgroundColor: colors.border },
  inset: { marginLeft: spacing.lg + 40 + spacing.md },
});
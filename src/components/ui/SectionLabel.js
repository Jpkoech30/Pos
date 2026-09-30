/**
 * <SectionLabel>
 *
 * Small uppercase muted text used to label groups of content:
 *   "ACCOUNT", "SECURITY", "NEW PASSWORD"
 */
import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export default function SectionLabel({ children, style }) {
  return <Text style={[styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
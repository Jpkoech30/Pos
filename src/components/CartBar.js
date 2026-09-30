import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../theme';

export default function CartBar({ itemCount, subtotal, onPress }) {
  if (itemCount === 0) return null;

  return (
    <TouchableOpacity style={styles.bar} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.left}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{itemCount}</Text>
        </View>
        <Text style={styles.label}>View Cart</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.total}>${subtotal.toFixed(2)}</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  left: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  badgeText: { color: colors.textInverse, fontWeight: '700', fontSize: 13 },
  label: { ...typography.button, color: colors.textInverse },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  total: { ...typography.h4, color: colors.textInverse },
});
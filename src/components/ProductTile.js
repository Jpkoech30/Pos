import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, typography, radii, shadows } from '../theme';

export default function ProductTile({ product, onPress }) {
  // Guard: if no product was passed, render nothing instead of crashing
  if (!product) {
    console.warn('ProductTile rendered without a `product` prop');
    return null;
  }

  // Guard: price might be a string from JSON, or missing entirely
  const price =
    typeof product.price === 'number'
      ? product.price
      : Number(product?.price) || 0;

  const initial = (product.name || '?').charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      style={styles.tile}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{initial}</Text>
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {product.name || 'Unnamed'}
      </Text>

      <Text style={styles.category} numberOfLines={1}>
        {product.category || '—'}
      </Text>

      <Text style={styles.price}>${price.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    ...shadows.sm,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  name: {
    ...typography.captionMedium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  category: {
    ...typography.tiny,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
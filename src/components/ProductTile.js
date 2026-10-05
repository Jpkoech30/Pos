import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKsh } from '../utils/format';
import { colors, spacing, typography, radii, shadows } from '../theme';

export default function ProductTile({
  product,
  quantity = 0,
  onPress,
  onLongPress,
}) {
  const inCart = quantity > 0;

  const handleAdd = () => onPress?.(product);
  const handleRemoveOne = () => onLongPress?.(product);

  return (
    <TouchableOpacity
      style={[styles.tile, inCart && styles.tileActive]}
      onPress={handleAdd}
      onLongPress={handleRemoveOne}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={
        inCart
          ? `${product.name}, ${quantity} in cart. Tap to add another.`
          : `${product.name}. Tap to add to cart.`
      }
    >
      <View style={styles.media}>
        <Ionicons
          name="cube-outline"
          size={26}
          color={inCart ? colors.primary : colors.textMuted}
        />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.price}>{formatKsh(product.price)}</Text>

      {inCart && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={handleRemoveOne}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Remove one ${product.name}`}
          >
            <Ionicons name="remove" size={18} color={colors.primary} />
          </TouchableOpacity>

          <Text style={styles.qtyValue}>{quantity}</Text>

          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={handleAdd}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Add another ${product.name}`}
          >
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    margin: spacing.sm / 2,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    minHeight: 132,
    ...shadows.sm,
  },
  tileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  media: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },

  name: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    minHeight: 36,
  },
  price: {
    ...typography.price,
    color: colors.text,
    marginTop: spacing.xs,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: 4,
    height: 32,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },
});
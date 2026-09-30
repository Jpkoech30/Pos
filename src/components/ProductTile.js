import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

const CATEGORY_ICONS = {
  Coffee: 'cafe-outline',
  Pastry: 'fast-food-outline',
  Sandwich: 'restaurant-outline',
  Salad: 'leaf-outline',
  Drink: 'water-outline',
  Default: 'cube-outline',
};

export default function ProductTile({ product, quantity = 0, onPress }) {
  if (!product) return null;

  const price =
    typeof product.price === 'number' ? product.price : Number(product.price) || 0;
  const icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.Default;
  const inCart = quantity > 0;

  return (
    <TouchableOpacity
      style={[styles.tile, inCart && styles.tileActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {inCart && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{quantity}</Text>
        </View>
      )}

      <View style={[styles.iconWrap, inCart && styles.iconWrapActive]}>
        <Ionicons
          name={icon}
          size={26}
          color={inCart ? colors.textInverse : colors.primary}
        />
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {product.name || 'Unnamed'}
      </Text>

      <Text style={styles.price}>{formatKES(price)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    margin: spacing.xs,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  tileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  name: {
    ...typography.captionMedium,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  price: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
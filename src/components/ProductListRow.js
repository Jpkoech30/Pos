import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatKsh } from '../utils/format';
import { colors, spacing, typography, radii, shadows } from '../theme';

const CATEGORY_META = {
  Coffee:          { icon: 'cafe-outline',       color: '#92400e', bg: '#fef3c7' },
  Grocery:         { icon: 'basket-outline',     color: '#065f46', bg: '#d1fae5' },
  Drinks:          { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Snacks:          { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  'Personal care': { icon: 'heart-outline',      color: '#9d174d', bg: '#fce7f3' },
  Household:       { icon: 'home-outline',       color: '#5b21b6', bg: '#ede9fe' },
  Pastry:          { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  Sandwich:        { icon: 'restaurant-outline', color: '#065f46', bg: '#d1fae5' },
  Salad:           { icon: 'leaf-outline',       color: '#166534', bg: '#dcfce7' },
  Drink:           { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Other:           { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
  Default:         { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
};

export function getStockStatus(stock, costPrice) {
  const s = Number(stock);
  if (s <= 0) return { text: 'Out of stock', color: colors.danger };
  if (s < 10) return { text: `${s} left`, color: colors.warning };
  if (costPrice == null) return { text: `${s} in stock · no cost`, color: colors.textMuted };
  return { text: `${s} in stock`, color: colors.textMuted };
}

export default function ProductListRow({
  product,
  selectionMode = false,
  selected = false,
  onPress,
  onLongPress,
  onStockPress,
}) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.Default;
  const price = Number(product.price);
  const stock = Number(product.stock);
  const status = getStockStatus(stock, product.costPrice);
  const out = stock <= 0;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        out && !selectionMode && styles.rowOut,
        selected && styles.rowSelected,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      activeOpacity={0.7}
    >
      {selectionMode && (
        <View style={[styles.checkbox, selected && styles.checkboxActive]}>
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      )}

      <View style={[styles.icon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>

      <View style={styles.body}>
        <View style={styles.line}>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.price}>{formatKsh(price)}</Text>
        </View>

        <View style={styles.line}>
          <View style={styles.metaLeft}>
            <Text style={styles.category} numberOfLines={1}>{product.category}</Text>
            <Text style={styles.sep}>·</Text>
            <Text
              style={[styles.stock, { color: status.color }]}
              numberOfLines={1}
            >
              {status.text}
            </Text>
          </View>

          {!selectionMode && (
            <TouchableOpacity
              style={styles.stockBtn}
              onPress={onStockPress}
              hitSlop={10}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={13} color={colors.primary} />
              <Text style={styles.stockBtnText}>Stock</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  rowOut: { opacity: 0.6 },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  checkbox: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  icon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { flex: 1, minWidth: 0, gap: 3 },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  price: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },

  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 0,
  },
  category: { ...typography.tiny, color: colors.textMuted },
  sep: { ...typography.tiny, color: colors.textMuted },
  stock: { ...typography.tiny, fontWeight: '600' },

  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  stockBtnText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
});
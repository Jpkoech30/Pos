import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, SectionLabel, Button } from '../../components/ui';
import { colors, spacing, typography, radii } from '../../theme';

const CATEGORY_META = {
  Coffee:    { icon: 'cafe-outline',       color: '#92400e', bg: '#fef3c7' },
  Pastry:    { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  Sandwich:  { icon: 'restaurant-outline', color: '#065f46', bg: '#d1fae5' },
  Salad:     { icon: 'leaf-outline',       color: '#166534', bg: '#dcfce7' },
  Drink:     { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Default:   { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
};

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const meta = CATEGORY_META[product.category] || CATEGORY_META.Default;
  const stock = Number(product.stock);

  const stockStatus =
    stock <= 0
      ? { label: 'Out of stock', color: colors.danger, bg: colors.dangerSoft }
      : stock < 10
      ? { label: `Low stock · ${stock} left`, color: colors.warning, bg: colors.warningSoft }
      : { label: `${stock} in stock`, color: colors.success, bg: colors.successSoft };

  return (
    <Screen scroll edges={['bottom']}>
      <Button
        title="Edit Product"
        icon="create-outline"
        onPress={() => navigation.navigate('ProductForm', { product })}
        style={{ marginBottom: spacing.lg }}
      />

      <Card variant="spacious" style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={40} color={meta.color} />
        </View>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>

        <View style={[styles.stockPill, { backgroundColor: stockStatus.bg }]}>
          <Text style={[styles.stockPillText, { color: stockStatus.color }]}>
            {stockStatus.label}
          </Text>
        </View>
      </Card>

      <SectionLabel>Details</SectionLabel>
      <Card variant="flat">
        <DetailRow label="SKU" value={product.sku || '—'} />
        <Divider />
        <DetailRow label="Barcode" value={product.barcode || '—'} />
        <Divider />
        <DetailRow label="Category" value={product.category} />
        <Divider />
        <DetailRow label="Price" value={`$${Number(product.price).toFixed(2)}`} />
        <Divider />
        <DetailRow label="Stock" value={String(stock)} />
      </Card>
    </Screen>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  category: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  price: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  stockPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  stockPillText: {
    ...typography.captionMedium,
    fontWeight: '600',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
});
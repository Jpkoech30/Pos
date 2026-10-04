import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, SectionLabel, Button } from '../../components/ui';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii } from '../../theme';

const CATEGORY_META = {
  Coffee:    { icon: 'cafe-outline',       color: '#92400e', bg: '#fef3c7' },
  Pastry:    { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  Sandwich:  { icon: 'restaurant-outline', color: '#065f46', bg: '#d1fae5' },
  Salad:     { icon: 'leaf-outline',       color: '#166534', bg: '#dcfce7' },
  Drink:     { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Other:     { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
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

  // Profit is only known when cost price exists.
  const profit = useMemo(() => {
    if (product.costPrice == null) return null;
    const selling = Number(product.price);
    const cost = Number(product.costPrice);
    const perUnit = selling - cost;
    const marginPct = selling > 0 ? (perUnit / selling) * 100 : 0;
    return { selling, cost, perUnit, marginPct };
  }, [product.price, product.costPrice]);

  return (
    <Screen scroll edges={['bottom']}>
      <Button
        title="Edit Product"
        icon="create-outline"
        onPress={() => navigation.navigate('ProductForm', { product })}
        style={{ marginBottom: spacing.lg }}
      />

      {/* Hero */}
      <Card variant="spacious" style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={40} color={meta.color} />
        </View>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatKsh(product.price)}</Text>

        <View style={[styles.stockPill, { backgroundColor: stockStatus.bg }]}>
          <Text style={[styles.stockPillText, { color: stockStatus.color }]}>
            {stockStatus.label}
          </Text>
        </View>
      </Card>

      {/* Profit — only if cost price is set */}
      <SectionLabel>Profit</SectionLabel>
      {profit == null ? (
        <Card variant="flat" style={styles.noCostCard}>
          <Ionicons name="help-circle-outline" size={20} color={colors.textMuted} />
          <View style={styles.noCostText}>
            <Text style={styles.noCostTitle}>No cost price set</Text>
            <Text style={styles.noCostSub}>
              Tap Edit to add what you pay for this product, and profit tracking
              will start from the next sale.
            </Text>
          </View>
        </Card>
      ) : (
        <Card variant="flat" style={styles.profitCard}>
          <ProfitRow
            label="Selling price"
            value={formatKsh(profit.selling)}
          />
          <Divider />
          <ProfitRow
            label="Cost price"
            value={formatKsh(profit.cost)}
          />
          <Divider />
          <ProfitRow
            label="Profit per unit"
            value={formatKsh(profit.perUnit)}
            valueColor={profit.perUnit >= 0 ? colors.success : colors.danger}
            bold
          />
          <Divider />
          <ProfitRow
            label="Margin"
            value={`${Math.round(profit.marginPct)}%`}
            valueColor={profit.perUnit >= 0 ? colors.success : colors.danger}
            bold
          />
        </Card>
      )}

      {/* Details */}
      <SectionLabel>Details</SectionLabel>
      <Card variant="flat">
        <DetailRow label="SKU" value={product.sku || '—'} />
        <Divider />
        <DetailRow label="Barcode" value={product.barcode || '—'} />
        <Divider />
        <DetailRow label="Category" value={product.category} />
        <Divider />
        <DetailRow label="Stock" value={String(stock)} />
      </Card>
    </Screen>
  );
}

function ProfitRow({ label, value, valueColor, bold }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          bold && styles.detailValueBold,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
    </View>
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

  // Profit section
  profitCard: {
    marginBottom: spacing.md,
  },
  noCostCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  noCostText: { flex: 1 },
  noCostTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  noCostSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  // Generic rows
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
  detailValueBold: {
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { Screen, Card, SectionLabel } from '../../components/ui';
import StockAdjustSheet from '../../components/StockAdjustSheet';
import { productsApi } from '../../services/products';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii } from '../../theme';

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

const LOW_STOCK_THRESHOLD = 10;

export default function ProductDetailScreen({ route, navigation }) {
  const { product: initial } = route.params;
  const [product, setProduct] = useState(initial);
  const [stockSheet, setStockSheet] = useState(false);

  const meta = CATEGORY_META[product.category] || CATEGORY_META.Default;
  const stock = Number(product.stock);
  const price = Number(product.price);
  const cost = product.costPrice != null ? Number(product.costPrice) : null;

  // Stock status
  const stockStatus =
    stock <= 0
      ? { label: 'Out of stock', color: colors.danger, bg: colors.dangerSoft }
      : stock < LOW_STOCK_THRESHOLD
      ? { label: `${stock} left — low`, color: colors.warning, bg: colors.warningSoft }
      : { label: `${stock} in stock`, color: colors.success, bg: colors.successSoft };

  // Profit
  const profit = cost != null && price > 0
    ? {
        perUnit: price - cost,
        marginPct: ((price - cost) / price) * 100,
      }
    : null;

  const handleStockSave = async (p, nextStock) => {
    const data = await productsApi.update(p.id, { stock: nextStock });
    const updated = data?.product || { ...p, stock: nextStock };
    setProduct((prev) => ({ ...prev, stock: nextStock }));
    Toast.show({
      type: 'success',
      text1: 'Stock updated',
      text2: `${nextStock} in stock`,
    });
  };

  return (
    <Screen scroll edges={['bottom']}>
      {/* ─── Hero ─── */}
      <Card variant="spacious" style={styles.hero}>
        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={40} color={meta.color} />
        </View>
        <Text style={styles.category}>{product.category}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatKsh(price)}</Text>

        <View style={[styles.stockPill, { backgroundColor: stockStatus.bg }]}>
          <Text style={[styles.stockPillText, { color: stockStatus.color }]}>
            {stockStatus.label}
          </Text>
        </View>
      </Card>

      {/* ─── Action buttons ─── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => setStockSheet(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionBtnTextPrimary}>Adjust stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => navigation.navigate('ProductForm', { product })}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={20} color={colors.primary} />
          <Text style={styles.actionBtnTextSecondary}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Stock & profit stats ─── */}
      <SectionLabel>At a glance</SectionLabel>
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
            <Text style={styles.statLabel}>In stock</Text>
          </View>
          <Text style={styles.statValue}>{stock}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Ionicons name="trending-up" size={14} color={colors.textMuted} />
            <Text style={styles.statLabel}>Margin</Text>
          </View>
          <Text
            style={[
              styles.statValue,
              profit && {
                color:
                  profit.marginPct < 0
                    ? colors.danger
                    : profit.marginPct < 15
                    ? colors.warning
                    : colors.success,
              },
            ]}
          >
            {profit ? `${Math.round(profit.marginPct)}%` : '—'}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconRow}>
            <Ionicons name="cash-outline" size={14} color={colors.textMuted} />
            <Text style={styles.statLabel}>Profit / unit</Text>
          </View>
          <Text
            style={[
              styles.statValue,
              profit && {
                color: profit.perUnit < 0 ? colors.danger : colors.success,
              },
            ]}
          >
            {profit ? formatKsh(profit.perUnit) : '—'}
          </Text>
        </View>
      </View>

      {/* ─── Pricing detail ─── */}
      <SectionLabel>Pricing</SectionLabel>
      <Card variant="flat">
        <DetailRow label="Selling price" value={formatKsh(price)} />
        <Divider />
        <DetailRow
          label="Cost price"
          value={cost != null ? formatKsh(cost) : 'Not set'}
          muted={cost == null}
        />
        {profit && (
          <>
            <Divider />
            <DetailRow
              label="Profit per unit"
              value={formatKsh(profit.perUnit)}
              valueColor={profit.perUnit >= 0 ? colors.success : colors.danger}
            />
          </>
        )}
      </Card>

      {/* ─── Codes & meta ─── */}
      <SectionLabel>Details</SectionLabel>
      <Card variant="flat">
        <DetailRow label="Category" value={product.category} />
        <Divider />
        <DetailRow
          label="SKU"
          value={product.sku || 'Not set'}
          muted={!product.sku}
        />
        <Divider />
        <DetailRow
          label="Barcode"
          value={product.barcode || 'Not set'}
          muted={!product.barcode}
        />
      </Card>

      {/* ─── Activity — placeholder for Phase 2 ─── */}
      <SectionLabel>Activity</SectionLabel>
      <Card variant="flat" style={styles.activityPlaceholder}>
        <Ionicons name="time-outline" size={20} color={colors.textMuted} />
        <Text style={styles.activityText}>
          Restock and sale history will appear here once stock tracking is on.
        </Text>
      </Card>

      <View style={{ height: spacing.xxxl }} />

      <StockAdjustSheet
        visible={stockSheet}
        product={product}
        onClose={() => setStockSheet(false)}
        onSave={handleStockSave}
      />
    </Screen>
  );
}

function DetailRow({ label, value, muted, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          muted && styles.detailValueMuted,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
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

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
  },
  actionBtnPrimary: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionBtnTextPrimary: {
    ...typography.button,
    color: '#fff',
    fontSize: 15,
  },
  actionBtnTextSecondary: {
    ...typography.button,
    color: colors.primary,
    fontSize: 15,
  },

  // Stats grid
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    ...typography.tiny,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.h3,
    color: colors.text,
    fontWeight: '700',
  },

  // Detail rows
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
  detailValueMuted: {
    color: colors.textMuted,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.lg,
  },

  // Activity placeholder
  activityPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityText: {
    ...typography.caption,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
});
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  mpesa: 'M-Pesa',
  mpesa_stk: 'M-Pesa (STK)',
};

export default function OrderDetailScreen({ route }) {
  const { order } = route.params || {};

  if (!order) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const date = new Date(order.createdAt).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;
  const failed = order.paymentStatus === 'failed';

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.hero}>
          <View style={[styles.statusCircle, failed && styles.statusCircleFail]}>
            <Ionicons
              name={failed ? 'close' : 'checkmark'}
              size={36}
              color="#fff"
            />
          </View>
          <Text style={styles.heroAmount}>{formatKsh(order.total)}</Text>
          <Text style={styles.heroSub}>
            Order #{order.id} · {paymentLabel}
          </Text>
          <Text style={styles.heroDate}>{date}</Text>
        </View>

        {/* Items */}
        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, idx) => (
            <View key={item.productId}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatKsh(item.price * item.quantity)}
                </Text>
              </View>
              {idx < order.items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Totals */}
        <Text style={styles.sectionLabel}>Totals</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatKsh(order.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatKsh(order.tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatKsh(order.total)}</Text>
          </View>
        </View>

        {/* Payment */}
        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Method</Text>
            <Text style={styles.metaValue}>{paymentLabel}</Text>
          </View>

          {order.paymentMethod === 'cash' && order.amountTendered != null && (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Received</Text>
                <Text style={styles.metaValue}>
                  {formatKsh(order.amountTendered)}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Change</Text>
                <Text style={styles.metaValue}>
                  {formatKsh(order.changeGiven || 0)}
                </Text>
              </View>
            </>
          )}

          {order.paymentMethod === 'mpesa' && order.mpesaPhone && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Sent to</Text>
              <Text style={styles.metaValue}>{order.mpesaPhone}</Text>
            </View>
          )}

          {order.mpesaReceiptNumber && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>M-Pesa receipt</Text>
              <Text style={styles.metaValue}>{order.mpesaReceiptNumber}</Text>
            </View>
          )}

          {failed && order.mpesaResultDesc && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Failure</Text>
              <Text style={[styles.metaValue, styles.failedText]}>
                {order.mpesaResultDesc}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textSecondary },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  statusCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#16a34a',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  statusCircleFail: { backgroundColor: colors.danger },
  heroAmount: { ...typography.h1, color: colors.text },
  heroSub: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  heroDate: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.sm,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemQty: { ...typography.body, color: colors.textMuted, width: 32 },
  itemName: { ...typography.body, color: colors.text, flex: 1 },
  itemPrice: { ...typography.body, color: colors.text, marginLeft: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.body, color: colors.text },
  grandRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  grandLabel: { ...typography.h3, color: colors.text },
  grandValue: { ...typography.h3, color: colors.text },

  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metaLabel: { ...typography.body, color: colors.textSecondary },
  metaValue: { ...typography.body, color: colors.text },
  failedText: { color: colors.danger },
});
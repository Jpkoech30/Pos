import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  mpesa: 'M-Pesa',
  mpesa_stk: 'M-Pesa (STK)',
};

function buildReceiptText(order, shop) {
  const lines = [];
  const date = new Date(order.createdAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const pad = 40;
  const line = (left, right) =>
    left.padEnd(pad - String(right).length, ' ') + String(right);

  lines.push(shop?.name || 'Receipt');
  if (shop?.address) lines.push(shop.address);
  if (shop?.mpesaNumber) lines.push(`Pochi: ${shop.mpesaNumber}`);
  lines.push('');

  lines.push(`Order #${order.id}`);
  lines.push(date);
  lines.push('');

  order.items.forEach((item) => {
    const left = `${item.quantity}× ${item.name}`;
    const right = formatKsh(item.price * item.quantity);
    lines.push(line(left, right));
  });

  lines.push('');

  const isVat = order.vatRate > 0;
  if (isVat) {
    lines.push(line('Subtotal', formatKsh(order.subtotal)));
    lines.push(line(
      order.taxInclusive ? 'VAT (included)' : `VAT (${order.vatRate}%)`,
      formatKsh(order.vatAmount),
    ));
  }
  lines.push(line('TOTAL', formatKsh(order.total)));
  lines.push('');

  const method = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;
  lines.push(line('Payment', method));

  if (order.paymentMethod === 'cash' && order.amountTendered != null) {
    lines.push(line('Received', formatKsh(order.amountTendered)));
    lines.push(line('Change', formatKsh(order.changeGiven || 0)));
  }
  if (order.mpesaReceiptNumber) {
    lines.push(line('M-Pesa ref', order.mpesaReceiptNumber));
  }

  lines.push('');
  lines.push('Thank you!');
  return lines.join('\n');
}

export default function ReceiptScreen({ navigation, route }) {
  const { shop } = useAuth();
  const { order } = route.params || {};

  if (!order) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No order to display</Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.doneText}>Back to Sale</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const date = new Date(order.createdAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  const paymentLabel = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;
  const failed = order.paymentStatus === 'failed';
  const isVat = order.vatRate > 0;

  const handleShare = async () => {
    try {
      await Share.share({ message: buildReceiptText(order, shop) });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Share failed', text2: err.message });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.successHeader}>
          <View style={[styles.checkCircle, failed && styles.checkCircleFail]}>
            <Ionicons name={failed ? 'close' : 'checkmark'} size={44} color="#fff" />
          </View>
          <Text style={styles.successTitle}>
            {failed ? 'Sale Failed' : 'Sale Complete'}
          </Text>
          <Text style={styles.successAmount}>{formatKsh(order.total)}</Text>
          <Text style={styles.successMeta}>
            {paymentLabel} · Order #{order.id}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.card}>
          {order.items.map((item, idx) => (
            <View key={item.productId}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatKsh(item.price * item.quantity)}
                </Text>
              </View>
              {idx < order.items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Totals</Text>
        <View style={styles.card}>
          {isVat && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal (excl. VAT)</Text>
                <Text style={styles.totalValue}>{formatKsh(order.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  VAT {order.taxInclusive ? '(included)' : `(${order.vatRate}%)`}
                </Text>
                <Text style={styles.totalValue}>{formatKsh(order.vatAmount)}</Text>
              </View>
            </>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatKsh(order.total)}</Text>
          </View>
        </View>

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

          {order.mpesaReceiptNumber && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>M-Pesa ref</Text>
              <Text style={styles.metaValue}>{order.mpesaReceiptNumber}</Text>
            </View>
          )}

          {order.staffName && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Served by</Text>
              <Text style={styles.metaValue}>{order.staffName}</Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{date}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary} />
          <Text style={styles.shareText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.popToTop()}
          activeOpacity={0.85}
        >
          <Text style={styles.doneText}>New Sale</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.md,
  },
  checkCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  checkCircleFail: { backgroundColor: colors.danger },
  successTitle: { ...typography.h2, color: colors.text },
  successAmount: { ...typography.priceLarge, color: colors.text, marginTop: spacing.xs },
  successMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },

  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: 'uppercase',
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: spacing.sm,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  itemQty: { ...typography.body, color: colors.textMuted, width: 32 },
  itemName: { ...typography.body, color: colors.text, flex: 1 },
  itemPrice: { ...typography.price, color: colors.text, marginLeft: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.price, color: colors.text },
  grandTotalRow: {
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
  },
  grandTotalLabel: { ...typography.h3, color: colors.text },
  grandTotalValue: { ...typography.priceLarge, color: colors.text },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metaLabel: { ...typography.body, color: colors.textSecondary },
  metaValue: { ...typography.body, color: colors.text },

  bottomBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.screenPadding,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  shareText: { ...typography.button, color: colors.primary, fontSize: 15 },
  doneBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  doneText: { ...typography.button, color: '#fff', fontSize: 17 },
});
import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

const KIOSK_NAME = 'My Kiosk'; // ← change to your shop name

export default function ReceiptScreen({ visible, receipt, onDone }) {
  if (!receipt) return null;

  const {
    id,
    items = [],
    subtotal,
    total,
    paymentMethod,
    createdAt,
    tendered,
    change,
    phone,
  } = receipt;

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleString('en-KE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const saleNumber = id ? id.replace(/^o/, '').padStart(4, '0') : '----';

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* SUCCESS HEADER */}
          <View style={styles.successWrap}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={44} color={colors.textInverse} />
            </View>
            <Text style={styles.successTitle}>Payment received</Text>
            <Text style={styles.successAmount}>{formatKES(total)}</Text>
          </View>

          {/* RECEIPT */}
          <View style={styles.receipt}>
            {/* Kiosk header */}
            <View style={styles.kioskHeader}>
              <Text style={styles.kioskName}>{KIOSK_NAME}</Text>
              <Text style={styles.receiptMeta}>
                Sale #{saleNumber} · {dateStr}
              </Text>
            </View>

            <View style={styles.dashed} />

            {/* Items */}
            {items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemQty}>{item.quantity}×</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                  {formatKES(Number(item.price) * item.quantity)}
                </Text>
              </View>
            ))}

            <View style={styles.dashed} />

            {/* Totals */}
            {subtotal != null && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatKES(subtotal)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandLabel}>TOTAL</Text>
              <Text style={styles.grandValue}>{formatKES(total)}</Text>
            </View>

            <View style={styles.dashed} />

            {/* Payment info */}
            <View style={styles.paymentBlock}>
              <PaymentLine label="Method" value={paymentMethod === 'cash' ? 'Cash' : 'M-Pesa'} />
              {paymentMethod === 'cash' && tendered != null && (
                <>
                  <PaymentLine label="Received" value={formatKES(tendered)} />
                  <PaymentLine label="Change" value={formatKES(change)} highlight />
                </>
              )}
              {paymentMethod === 'mpesa' && phone && (
                <PaymentLine label="Paid from" value={phone} />
              )}
            </View>

            <View style={styles.dashed} />

            <Text style={styles.footer}>Asante! Come again.</Text>
          </View>
        </ScrollView>

        {/* DONE */}
        <View style={styles.footerBtnWrap}>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={onDone}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function PaymentLine({ label, value, highlight }) {
  return (
    <View style={styles.payLine}>
      <Text style={styles.payLabel}>{label}</Text>
      <Text style={[styles.payValue, highlight && styles.payValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },

  // Success header
  successWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  successTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  successAmount: {
    ...typography.display,
    color: colors.success,
  },

  // Receipt card
  receipt: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  kioskHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  kioskName: {
    ...typography.h4,
    color: colors.text,
    marginBottom: 4,
  },
  receiptMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },

  dashed: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: spacing.md,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: spacing.sm,
  },
  itemQty: {
    ...typography.bodyBold,
    color: colors.primary,
    minWidth: 32,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    ...typography.bodyMedium,
    color: colors.text,
    minWidth: 80,
    textAlign: 'right',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  totalLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  totalValue: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  grandTotalRow: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandLabel: {
    ...typography.h4,
    color: colors.text,
  },
  grandValue: {
    ...typography.h3,
    color: colors.primary,
  },

  paymentBlock: {
    paddingVertical: spacing.xs,
  },
  payLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  payLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  payValue: {
    ...typography.captionMedium,
    color: colors.text,
  },
  payValueHighlight: {
    color: colors.success,
    fontWeight: '700',
  },

  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Done button
  footerBtnWrap: {
    padding: spacing.screenPadding,
    paddingTop: spacing.sm,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    ...shadows.md,
  },
  doneBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../context/CartContext';
import { ordersApi } from '../services/orders';
import { colors, spacing, typography, radii, shadows } from '../theme';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: 'cash-outline' },
  { id: 'card', label: 'Card', icon: 'card-outline' },
];

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, tax, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (items.length === 0) {
      Toast.show({ type: 'info', text1: 'Cart is empty' });
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const data = await ordersApi.create(
        items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        paymentMethod
      );

      clearCart();
      navigation.replace('Receipt', { order: data.order });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Checkout failed', text2: err.message });
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Items */}
        <Text style={styles.sectionLabel}>Order</Text>
        <View style={styles.card}>
          {items.map((item, idx) => (
            <View key={item.productId}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemQty}>{item.quantity}×</Text>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                </View>
                <Text style={styles.itemPrice}>
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              {idx < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Totals */}
        <Text style={styles.sectionLabel}>Totals</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Payment method */}
        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={styles.payRow}>
          {PAYMENT_METHODS.map((m) => {
            const selected = paymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.payTile, selected && styles.payTileSelected]}
                onPress={() => setPaymentMethod(m.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={m.icon}
                  size={26}
                  color={selected ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.payLabel, selected && styles.payLabelSelected]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Confirm bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.confirmText}>Charge ${total.toFixed(2)}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
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
  itemQty: {
    ...typography.body,
    color: colors.textMuted,
    width: 32,
  },
  itemName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  itemPrice: {
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.body, color: colors.text },
  grandTotalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  grandTotalLabel: { ...typography.h3, color: colors.text },
  grandTotalValue: { ...typography.h3, color: colors.text },

  payRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  payTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    gap: spacing.xs,
    ...shadows.sm,
  },
  payTileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  payLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  payLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },

  bottomBar: {
    padding: spacing.screenPadding,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: {
    ...typography.button,
    color: colors.textInverse,
    fontSize: 17,
  },
});
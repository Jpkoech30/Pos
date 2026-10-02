import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../../context/CartContext';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

export default function CheckoutScreen({ navigation }) {
  const {
    items, subtotal, tax, total,
    updateQty, removeItem, clearCart,
  } = useCart();

  const handleClear = () => {
    clearCart();
    Toast.show({ type: 'info', text1: 'Cart cleared' });
    navigation.goBack();
  };

  const handleQtyChange = (productId, currentQty, delta) => {
    const next = currentQty + delta;
    if (next <= 0) {
      removeItem(productId);
    } else {
      updateQty(productId, next);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={56} color={colors.textMuted} />
          <Text style={styles.emptyText}>Cart is empty</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyBtnText}>Back to Sale</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Order</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearLink}>Clear all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {items.map((item, idx) => (
            <View key={item.productId}>
              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemUnit}>
                    {formatKsh(item.price)} each
                  </Text>
                </View>

                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleQtyChange(item.productId, item.quantity, -1)}
                    hitSlop={6}
                  >
                    <Ionicons name="remove" size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => handleQtyChange(item.productId, item.quantity, 1)}
                    hitSlop={6}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemPrice}>
                  {formatKsh(item.price * item.quantity)}
                </Text>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeItem(item.productId)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              {idx < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabelStandalone}>Totals</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatKsh(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatKsh(tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatKsh(total)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabelStandalone}>Payment</Text>
        <View style={styles.payRow}>
          <TouchableOpacity
            style={styles.payTile}
            onPress={() => navigation.navigate('MpesaPayment')}
            activeOpacity={0.8}
          >
            <Ionicons name="phone-portrait-outline" size={28} color={colors.primary} />
            <Text style={styles.payLabel}>M-Pesa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.payTile}
            onPress={() => navigation.navigate('CashPayment')}
            activeOpacity={0.8}
          >
            <Ionicons name="cash-outline" size={28} color={colors.primary} />
            <Text style={styles.payLabel}>Cash</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.payTile}
            onPress={() => navigation.navigate('StkPush')}
            activeOpacity={0.8}
          >
            <Ionicons name="flash-outline" size={28} color={colors.primary} />
            <Text style={styles.payLabel}>STK Push</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.body, color: colors.textSecondary,
    marginTop: spacing.md, marginBottom: spacing.lg,
  },
  emptyBtn: {
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    backgroundColor: colors.primary, borderRadius: radii.md,
  },
  emptyBtnText: { ...typography.button, color: colors.textInverse },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionLabelStandalone: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  clearLink: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
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
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  itemLeft: { flex: 1, minWidth: 0 },
  itemName: { ...typography.bodyMedium, color: colors.text, fontWeight: '600' },
  itemUnit: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },

  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  qtyValue: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
  },

  itemPrice: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },
  removeBtn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },

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

  payRow: { flexDirection: 'row', gap: spacing.sm },
  payTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    ...shadows.sm,
  },
  payLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
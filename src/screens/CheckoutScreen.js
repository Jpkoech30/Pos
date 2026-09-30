import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, tax, total } = useCart();

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
                  KSh {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
              {idx < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Totals</Text>
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>KSh {subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>KSh {tax.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>KSh {total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Payment</Text>
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
    gap: spacing.sm,
  },
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
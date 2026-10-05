import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../services/orders';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii } from '../../theme';

export default function MpesaPaymentScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const { shop } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const pochiNumber = shop?.mpesaNumber || null;

  const handleReceived = async () => {
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
        'mpesa',
        { mpesaPhone: pochiNumber ? pochiNumber.replace(/\s/g, '') : null },
      );
      clearCart();
      navigation.replace('Receipt', { order: data.order });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
      setSubmitting(false);
    }
  };

  // No Pochi number configured on this shop
  if (!pochiNumber) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.warning} />
          </View>
          <Text style={styles.emptyTitle}>No Pochi number set</Text>
          <Text style={styles.emptySub}>
            Ask the shop owner to add their Pochi la Biashara number in
            Profile → Shop settings.
          </Text>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancelPrimary}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.cancelPrimaryText}>Back to Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.label}>Ask customer to send</Text>
        <Text style={styles.total}>{formatKsh(total)}</Text>

        <View style={styles.numberBox}>
          <Text style={styles.numberCaption}>to Pochi la Biashara</Text>
          <Text style={styles.number}>{pochiNumber}</Text>
        </View>

        <View style={styles.hintRow}>
          <Ionicons name="phone-portrait-outline" size={20} color={colors.textMuted} />
          <Text style={styles.hint}>Wait for the M-Pesa SMS confirmation</Text>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.confirm, submitting && styles.confirmDisabled]}
          onPress={handleReceived}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.confirmText}>Payment Received</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancel}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1, padding: spacing.screenPadding,
    alignItems: 'center', justifyContent: 'center',
  },

  iconCircle: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.warningSoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.h3, color: colors.text },
  emptySub: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
    maxWidth: 300, lineHeight: 22,
  },

  label: {
    ...typography.caption, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  total: {
    ...typography.h1, color: colors.text, fontSize: 44,
    marginTop: spacing.sm, marginBottom: spacing.xxl,
  },
  numberBox: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xl, paddingHorizontal: spacing.xxl,
    borderRadius: radii.lg, alignItems: 'center',
    width: '100%', maxWidth: 340,
    borderWidth: 1, borderColor: colors.border,
  },
  numberCaption: {
    ...typography.caption, color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  number: {
    ...typography.h1, color: colors.primary,
    fontSize: 32, letterSpacing: 1,
  },
  hintRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginTop: spacing.xxl,
  },
  hint: { ...typography.body, color: colors.textMuted },

  bottomBar: { padding: spacing.screenPadding, gap: spacing.sm },
  confirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.lg, borderRadius: radii.md, gap: spacing.sm,
  },
  confirmDisabled: { opacity: 0.6 },
  confirmText: { ...typography.button, color: '#fff', fontSize: 18 },
  cancel: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textMuted },

  cancelPrimary: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
  },
  cancelPrimaryText: {
    ...typography.button, color: '#fff', fontSize: 17,
  },
});
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../../context/CartContext';
import { ordersApi } from '../../services/orders';
import { KIOSK } from '../../config';
import { colors, spacing, typography, radii } from '../../theme';

export default function MpesaPaymentScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);

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
        { mpesaPhone: KIOSK.mpesaNumber.replace(/\s/g, '') },
      );
      clearCart();
      navigation.replace('Receipt', { order: data.order });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.label}>Ask customer to send</Text>
        <Text style={styles.total}>KSh {total.toFixed(2)}</Text>

        <View style={styles.numberBox}>
          <Text style={styles.numberCaption}>to {KIOSK.mpesaLabel}</Text>
          <Text style={styles.number}>{KIOSK.mpesaNumber}</Text>
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
  },
  numberCaption: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  number: { ...typography.h1, color: colors.primary, fontSize: 32, letterSpacing: 1 },
  hintRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginTop: spacing.xxl,
  },
  hint: { ...typography.body, color: colors.textMuted },
  bottomBar: { padding: spacing.screenPadding, gap: spacing.sm },
  confirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: spacing.lg, borderRadius: radii.md, gap: spacing.sm,
  },
  confirmDisabled: { opacity: 0.6 },
  confirmText: { ...typography.button, color: '#fff', fontSize: 18 },
  cancel: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textMuted },
});
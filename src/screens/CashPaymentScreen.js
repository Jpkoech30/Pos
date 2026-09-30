import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../context/CartContext';
import { ordersApi } from '../services/orders';
import { colors, spacing, typography, radii } from '../theme';

const DENOMS = [50, 100, 200, 500, 1000];

export default function CashPaymentScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const [notes, setNotes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const effective = notes.reduce((s, n) => s + n, 0);
  const change = effective - total;
  const short = effective > 0 && change < 0;
  const canConfirm = effective >= total && !submitting;

  const addNote = (amount) => setNotes((prev) => [...prev, amount]);
  const removeNote = (index) =>
    setNotes((prev) => prev.filter((_, i) => i !== index));
  const setExact = () => setNotes([total]);
  const reset = () => setNotes([]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      const data = await ordersApi.create(
        items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        'cash',
        { amountTendered: effective, changeGiven: Math.max(change, 0) },
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={reset} disabled={notes.length === 0}>
            <Text style={[styles.reset, notes.length === 0 && styles.resetDisabled]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>KSh {total.toFixed(2)}</Text>

          <Text style={[styles.label, styles.labelSpacer]}>Received</Text>
          <Text style={styles.received}>KSh {effective.toFixed(2)}</Text>

          {/* Chips of counted notes */}
          {notes.length > 0 && (
            <View style={styles.chipsRow}>
              {notes.map((n, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.chip}
                  onPress={() => removeNote(i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipText}>{n}</Text>
                  <Ionicons name="close" size={14} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Denom buttons */}
          <View style={styles.denomRow}>
            {DENOMS.map((d) => (
              <TouchableOpacity
                key={d}
                style={styles.denomBtn}
                onPress={() => addNote(d)}
              >
                <Text style={styles.denomText}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.exactBtn} onPress={setExact}>
            <Text style={styles.exactText}>Exact amount</Text>
          </TouchableOpacity>

          <View style={styles.changeBox}>
            <Text style={styles.label}>Change</Text>
            <Text
              style={[
                styles.change,
                short && styles.changeShort,
                canConfirm && styles.changeOk,
              ]}
            >
              {effective === 0
                ? '—'
                : short
                ? `Short by KSh ${Math.abs(change).toFixed(2)}`
                : `KSh ${change.toFixed(2)}`}
            </Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirm, !canConfirm && styles.confirmDisabled]}
            onPress={handleConfirm}
            disabled={!canConfirm}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={styles.confirmText}>Confirm Sale</Text>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  topBar: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
    alignItems: 'flex-end',
  },
  reset: { ...typography.body, color: colors.primary },
  resetDisabled: { color: colors.textMuted },

  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  labelSpacer: { marginTop: spacing.xl },
  total: {
    ...typography.h1,
    color: colors.text,
    fontSize: 40,
    marginTop: spacing.xs,
  },
  received: {
    ...typography.h1,
    color: colors.text,
    fontSize: 40,
    marginTop: spacing.xs,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '700',
  },

  denomRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  denomBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  denomText: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },

  exactBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    borderStyle: 'dashed',
  },
  exactText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },

  changeBox: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  change: {
    ...typography.h1,
    color: colors.textMuted,
    fontSize: 36,
    marginTop: spacing.xs,
  },
  changeOk: { color: '#16a34a' },
  changeShort: { color: colors.danger },

  bottomBar: {
    padding: spacing.screenPadding,
    gap: spacing.sm,
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  confirmDisabled: { opacity: 0.4 },
  confirmText: {
    ...typography.button,
    color: '#fff',
    fontSize: 18,
  },
  cancel: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
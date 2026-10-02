import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../../context/CartContext';
import { mpesaApi } from '../../services/mpesa';
import { colors, spacing, typography, radii } from '../../theme';

const POLL_INTERVAL = 2000;
const TIMEOUT_MS = 90000;

export default function StkPushScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState('input');
  const [orderId, setOrderId] = useState(null);
  const [result, setResult] = useState(null);

  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const validPhone = /^(254|0|\+254)?[17]\d{8}$/.test(phone.replace(/\s/g, ''));

  const handleSend = async () => {
    if (!validPhone) {
      Toast.show({ type: 'error', text1: 'Enter a valid Kenyan number' });
      return;
    }
    try {
      setPhase('waiting');
      const data = await mpesaApi.initiateStk({
        phone,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      });
      setOrderId(data.orderId);

      pollRef.current = setInterval(async () => {
        try {
          const s = await mpesaApi.status(data.orderId);
          if (s.status === 'completed' || s.status === 'failed') {
            clearInterval(pollRef.current);
            clearTimeout(timeoutRef.current);
            setResult(s.order);
            setPhase('done');
            if (s.status === 'completed') clearCart();
          }
        } catch (e) {}
      }, POLL_INTERVAL);

      timeoutRef.current = setTimeout(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        setPhase('input');
        Toast.show({ type: 'error', text1: 'Timed out', text2: 'No response from M-Pesa' });
      }, TIMEOUT_MS);
    } catch (err) {
      setPhase('input');
      Toast.show({ type: 'error', text1: 'STK Push failed', text2: err.message });
    }
  };

  if (phase === 'waiting') {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.waitTitle}>Waiting for PIN</Text>
          <Text style={styles.waitSub}>A prompt was sent to {phone}</Text>
          <Text style={styles.waitHint}>
            Ask the customer to enter their M-Pesa PIN on their phone
          </Text>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cancel}
            onPress={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setPhase('input');
            }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    const success = result?.paymentStatus === 'completed';
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <View style={[styles.resultCircle, success ? styles.okCircle : styles.failCircle]}>
            <Ionicons name={success ? 'checkmark' : 'close'} size={48} color="#fff" />
          </View>
          <Text style={styles.resultTitle}>
            {success ? 'Payment Received' : 'Payment Failed'}
          </Text>
          {result?.mpesaReceiptNumber && (
            <Text style={styles.receipt}>Receipt: {result.mpesaReceiptNumber}</Text>
          )}
          {result?.mpesaResultDesc && !success && (
            <Text style={styles.reason}>{result.mpesaResultDesc}</Text>
          )}
        </View>
        <View style={styles.bottomBar}>
          {success ? (
            <TouchableOpacity
              style={styles.confirm}
              onPress={() => navigation.replace('Receipt', { order: result })}
            >
              <Text style={styles.confirmText}>View Receipt</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.confirm}
                onPress={() => { setPhase('input'); setResult(null); }}
              >
                <Text style={styles.confirmText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
                <Text style={styles.cancelText}>Back to Checkout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <Text style={styles.label}>Customer M-Pesa number</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="07XX XXX XXX"
            placeholderTextColor={colors.textMuted}
            value={phone}
            onChangeText={setPhone}
            maxLength={13}
          />
          <Text style={styles.hint}>A PIN prompt will be sent to this number</Text>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Amount to charge</Text>
            <Text style={styles.summaryAmount}>KSh {total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.confirm, !validPhone && styles.disabled]}
            onPress={handleSend}
            disabled={!validPhone}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
            <Text style={styles.confirmText}>Send STK Push</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()}>
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
  content: { flex: 1, padding: spacing.screenPadding },
  label: {
    ...typography.caption, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: spacing.sm, marginTop: spacing.lg,
  },
  input: {
    ...typography.h2, color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    letterSpacing: 1,
  },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  summary: {
    marginTop: spacing.xxl, padding: spacing.lg,
    backgroundColor: colors.surface, borderRadius: radii.md, alignItems: 'center',
  },
  summaryLabel: { ...typography.caption, color: colors.textMuted },
  summaryAmount: { ...typography.h1, color: colors.text, marginTop: spacing.xs },
  waitTitle: { ...typography.h2, color: colors.text, marginTop: spacing.xl },
  waitSub: {
    ...typography.body, color: colors.textSecondary,
    marginTop: spacing.sm, textAlign: 'center',
  },
  waitHint: {
    ...typography.caption, color: colors.textMuted,
    marginTop: spacing.lg, textAlign: 'center', maxWidth: 260,
  },
  resultCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  okCircle: { backgroundColor: '#16a34a' },
  failCircle: { backgroundColor: colors.danger },
  resultTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg },
  receipt: { ...typography.bodyMedium, color: colors.text, marginTop: spacing.md },
  reason: {
    ...typography.body, color: colors.textMuted,
    marginTop: spacing.sm, textAlign: 'center',
  },
  bottomBar: { padding: spacing.screenPadding, gap: spacing.sm },
  confirm: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg, borderRadius: radii.md, gap: spacing.sm,
  },
  disabled: { opacity: 0.4 },
  confirmText: { ...typography.button, color: '#fff', fontSize: 17 },
  cancel: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textMuted },
});
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { mpesaApi } from '../../services/mpesa';
import { newIdempotencyKey } from '../../utils/idempotency';
import { colors, spacing, typography, radii } from '../../theme';

const POLL_INTERVAL = 2000;
const QUERY_AFTER_MS = 30000;
const TIMEOUT_MS = 90000;

export default function StkPushScreen({ navigation }) {
  const { items, total, clearCart } = useCart();
  const { shop } = useAuth();

  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState('input');
  const [orderId, setOrderId] = useState(null);
  const [result, setResult] = useState(null);

  // One key per attempt. Reused on every retry of Send. Reset by Try Again.
  const keyRef = useRef(null);
  if (keyRef.current === null) {
    keyRef.current = newIdempotencyKey();
  }

  const pollRef = useRef(null);
  const timeoutRef = useRef(null);

  const stkEnabled = shop?.stkEnabled === true;

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', async () => {
      if (phase === 'waiting' && orderId) {
        try {
          const s = await mpesaApi.status(orderId);
          if (s.status !== 'pending') {
            stopPolling();
            setResult(s.order);
            setPhase('done');
            if (s.status === 'completed') clearCart();
          }
        } catch {
          // Ignore — polling will keep trying
        }
      }
    });
    return unsub;
  }, [navigation, phase, orderId, clearCart]);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current = null;
    timeoutRef.current = null;
  };

  const startPolling = (id) => {
    const startedAt = Date.now();
    let queried = false;

    pollRef.current = setInterval(async () => {
      try {
        const elapsed = Date.now() - startedAt;

        if (elapsed > QUERY_AFTER_MS && !queried) {
          queried = true;
          try {
            const q = await mpesaApi.query(id);
            if (q.status === 'completed' || q.status === 'failed') {
              stopPolling();
              setResult(q.order);
              setPhase('done');
              if (q.status === 'completed') clearCart();
              return;
            }
          } catch {
            // Query failed — fall through to normal status check
          }
        }

        const s = await mpesaApi.status(id);
        if (s.status === 'completed' || s.status === 'failed') {
          stopPolling();
          setResult(s.order);
          setPhase('done');
          if (s.status === 'completed') clearCart();
        }
      } catch {
        // Transient — keep polling
      }
    }, POLL_INTERVAL);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setPhase('input');
      Toast.show({
        type: 'error',
        text1: 'Timed out',
        text2: 'No response from M-Pesa',
      });
    }, TIMEOUT_MS);
  };

  const handleSend = async () => {
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
        idempotencyKey: keyRef.current,
      });
      setOrderId(data.orderId);
      startPolling(data.orderId);
    } catch (err) {
      setPhase('input');
      Toast.show({
        type: 'error',
        text1: 'STK Push failed',
        text2: err.message,
      });
    }
  };

  const handleCancelWaiting = async () => {
    stopPolling();
    if (orderId) {
      try {
        await mpesaApi.cancel(orderId);
      } catch {
        // Best-effort — the sweeper will catch it
      }
    }
    setPhase('input');
    setOrderId(null);
  };

  const handleTryAgain = () => {
    // Fresh attempt — new key so the backend treats this as a new order.
    keyRef.current = newIdempotencyKey();
    setPhase('input');
    setResult(null);
    setOrderId(null);
  };

  if (!stkEnabled && phase === 'input') {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <View style={styles.notConfiguredIcon}>
            <Ionicons name="flash-off-outline" size={40} color={colors.textMuted} />
          </View>
          <Text style={styles.notConfiguredTitle}>STK Push not set up</Text>
          <Text style={styles.notConfiguredSub}>
            Add Daraja credentials in Profile → STK Push to enable automatic
            M-Pesa payment prompts.
          </Text>
        </View>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to Checkout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            style={styles.cancelPrimary}
            onPress={handleCancelWaiting}
            activeOpacity={0.85}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
            <Text style={styles.cancelPrimaryText}>Cancel & use another method</Text>
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
            <Ionicons
              name={success ? 'checkmark' : 'close'}
              size={48}
              color="#fff"
            />
          </View>
          <Text style={styles.resultTitle}>
            {success ? 'Payment Received' : 'Payment Failed'}
          </Text>
          {result?.mpesaReceiptNumber && (
            <Text style={styles.receipt}>
              Receipt: {result.mpesaReceiptNumber}
            </Text>
          )}
          {result?.mpesaResultDesc && !success && (
            <Text style={styles.reason}>{result.mpesaResultDesc}</Text>
          )}
        </View>
        <View style={styles.bottomBar}>
          {success ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.replace('Receipt', { order: result })}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>View Receipt</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleTryAgain}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelText}>Back to Checkout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const validPhone = /^(254|0|\+254)?[17]\d{8}$/.test(phone.replace(/\s/g, ''));

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
            style={[styles.primaryBtn, !validPhone && styles.disabled]}
            onPress={handleSend}
            disabled={!validPhone}
            activeOpacity={0.85}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Send STK Push</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancel}
            onPress={() => navigation.goBack()}
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
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl,
  },

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
    backgroundColor: colors.surface, borderRadius: radii.md,
    alignItems: 'center',
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
  okCircle: { backgroundColor: colors.success },
  failCircle: { backgroundColor: colors.danger },
  resultTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg },
  receipt: { ...typography.bodyMedium, color: colors.text, marginTop: spacing.md },
  reason: {
    ...typography.body, color: colors.textMuted,
    marginTop: spacing.sm, textAlign: 'center',
  },

  notConfiguredIcon: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  notConfiguredTitle: { ...typography.h3, color: colors.text },
  notConfiguredSub: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
    maxWidth: 300, lineHeight: 22,
  },

  bottomBar: { padding: spacing.screenPadding, gap: spacing.sm },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg, borderRadius: radii.md, gap: spacing.sm,
  },
  primaryBtnText: { ...typography.button, color: '#fff', fontSize: 17 },
  disabled: { opacity: 0.4 },

  cancelPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.lg, borderRadius: radii.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.danger,
  },
  cancelPrimaryText: {
    ...typography.button, color: colors.danger, fontSize: 15,
  },
  cancel: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.body, color: colors.textMuted },
});
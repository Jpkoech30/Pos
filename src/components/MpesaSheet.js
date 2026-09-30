import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

// Simulate the STK push delay — replace with real Daraja call later
const SIMULATED_PUSH_MS = 5000;

// Phase machine
const PHASE = {
  ENTER_PHONE: 'ENTER_PHONE',
  WAITING: 'WAITING',
  CONFIRMED: 'CONFIRMED',
};

export default function MpesaSheet({ visible, onClose, onConfirm }) {
  const cart = useCart();
  const [phase, setPhase] = useState(PHASE.ENTER_PHONE);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  // Reset when reopened
  useEffect(() => {
    if (visible) {
      setPhase(PHASE.ENTER_PHONE);
      setPhone('');
      setError('');
    }
  }, [visible]);

  // Simulate STK push lifecycle when we enter WAITING
  useEffect(() => {
    if (phase !== PHASE.WAITING) return;

    const t = setTimeout(() => {
      setPhase(PHASE.CONFIRMED);
    }, SIMULATED_PUSH_MS);

    return () => clearTimeout(t);
  }, [phase]);

  // Auto-confirm 2s after success — the receipt screen takes over from there
  useEffect(() => {
    if (phase !== PHASE.CONFIRMED) return;

    const t = setTimeout(() => {
      onConfirm({
        method: 'mpesa',
        phone: normalizePhone(phone),
      });
    }, 1500);

    return () => clearTimeout(t);
  }, [phase]);

  const handleSend = () => {
    const cleaned = normalizePhone(phone);
    if (!isValidKenyanPhone(cleaned)) {
      setError('Enter a valid Kenyan number (e.g. 0712 345 678)');
      return;
    }
    setError('');
    setPhone(cleaned);
    setPhase(PHASE.WAITING);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={phase === PHASE.WAITING ? undefined : onClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Amount banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerLabel}>Amount</Text>
            <Text style={styles.bannerValue}>{formatKES(cart.total)}</Text>
          </View>

          {phase === PHASE.ENTER_PHONE && (
            <View style={styles.body}>
              <Text style={styles.help}>
                Send a payment request to the customer's M-Pesa. They'll
                receive a prompt on their phone to enter their PIN.
              </Text>

              <Text style={styles.inputLabel}>Customer phone number</Text>
              <View style={[styles.inputWrap, error && styles.inputWrapError]}>
                <Ionicons name="call-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="0712 345 678"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    if (error) setError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleSend}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={18} color={colors.textInverse} />
                <Text style={styles.primaryBtnText}>Send request</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === PHASE.WAITING && (
            <View style={styles.body}>
              <View style={styles.waitingIcon}>
                <ActivityIndicator size="large" color={colors.info} />
              </View>
              <Text style={styles.waitingTitle}>Waiting for PIN</Text>
              <Text style={styles.waitingHelp}>
                A prompt has been sent to {phone}.{'\n'}
                Ask the customer to enter their M-Pesa PIN.
              </Text>

              <View style={styles.infoBanner}>
                <Ionicons name="information-circle-outline" size={18} color={colors.info} />
                <Text style={styles.infoBannerText}>
                  Do not close this screen until the customer confirms.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.cancelLink}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelLinkText}>Cancel request</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === PHASE.CONFIRMED && (
            <View style={styles.body}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Payment received</Text>
              <Text style={styles.successHelp}>
                {formatKES(cart.total)} received from {phone}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// --- helpers ---

function normalizePhone(input) {
  const digits = String(input || '').replace(/\D/g, '');
  // Accept 07XX / 01XX (10 digits) or 254 7XX / 254 1XX (12 digits)
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 10) return '254' + digits.slice(1);
  return digits;
}

function isValidKenyanPhone(digits) {
  // Must be 254 followed by 9 digits starting with 7 or 1
  return /^254[17]\d{8}$/.test(digits);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayDark,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    paddingBottom: spacing.xl,
    ...shadows.xl,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },

  banner: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bannerLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bannerValue: {
    ...typography.h2,
    color: colors.primary,
  },

  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.md,
  },

  // --- Enter phone ---
  help: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  inputWrapError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    ...typography.body,
    color: colors.text,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: -4,
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.info,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },

  // --- Waiting ---
  waitingIcon: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  waitingTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  waitingHelp: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.infoSoft,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  infoBannerText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  cancelLinkText: {
    ...typography.bodyMedium,
    color: colors.textMuted,
  },

  // --- Confirmed ---
  successIcon: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successTitle: {
    ...typography.h2,
    color: colors.success,
    textAlign: 'center',
  },
  successHelp: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
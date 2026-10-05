import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { staffApi } from '../services/staff';
import { useShift } from '../context/ShiftContext';
import { colors, spacing, typography, radii } from '../theme';

export default function CheckInSheet({ visible, mode, onClose, onSuccess }) {
  const { staff: currentStaff, checkIn, checkOut } = useShift();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError(null);
      setSubmitting(false);
      if (mode === 'checkin') {
        setTimeout(() => inputRef.current?.focus(), 200);
      }
    }
  }, [visible, mode]);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (mode === 'checkin' && pin.length === 4 && !submitting) {
      submitPin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const submitPin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await staffApi.verifyPin(pin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await checkIn(data.staff);
      if (onSuccess) onSuccess(data.staff);
      onClose();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err.message || 'Incorrect PIN');
      setPin('');
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleCheckOut = async () => {
    await checkOut();
    onClose();
  };

  // ── Check out mode ──
  if (mode === 'checkout') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>On shift</Text>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.whoCard}>
              <View style={styles.whoAvatar}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.whoBody}>
                <Text style={styles.whoName}>{currentStaff?.name || 'Unknown'}</Text>
                <Text style={styles.whoRole}>
                  {currentStaff?.role === 'owner' ? 'Owner' :
                   currentStaff?.role === 'manager' ? 'Manager' : 'Cashier'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.checkOutBtn}
              onPress={handleCheckOut}
              activeOpacity={0.85}
            >
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.checkOutText}>Check out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // ── Check in mode ──
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Check in</Text>
                <Text style={styles.subtitle}>Enter your 4-digit PIN</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <TextInput
              ref={inputRef}
              style={[styles.pinInput, error && styles.pinInputError]}
              keyboardType="number-pad"
              maxLength={4}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              editable={!submitting}
            />

            {submitting && (
              <View style={styles.statusRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.statusText}>Checking…</Text>
              </View>
            )}

            {error && !submitting && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.helpText}>
              Ask the owner if you don't know your PIN.
            </Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h3, color: colors.text },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  pinInput: {
    ...typography.h1,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 28,
  },
  pinInputError: { borderColor: colors.danger },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statusText: { ...typography.caption, color: colors.textMuted },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
  },
  errorText: { ...typography.caption, color: colors.danger, flex: 1 },

  helpText: {
    ...typography.tiny,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },

  whoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  whoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoBody: { flex: 1 },
  whoName: { ...typography.bodyMedium, color: colors.text, fontWeight: '700' },
  whoRole: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  checkOutText: { ...typography.button, color: '#fff' },
  cancelBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  cancelText: { ...typography.bodyMedium, color: colors.textMuted },
});
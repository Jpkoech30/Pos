import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Modal, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { staffApi } from '../services/staff';
import { useShift } from '../context/ShiftContext';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography, radii } from '../theme';

export default function LockOverlay() {
  const { staff, isLocked, unlock, checkOut } = useShift();
  const { signOut } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setError(null);
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isLocked]);

  useEffect(() => {
    if (pin.length === 4 && !submitting) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await staffApi.verifyPin(pin);
      if (String(data.staff.id) !== String(staff?.id)) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setError(`This shift belongs to ${staff?.name || 'someone else'}`);
        setPin('');
        setSubmitting(false);
        inputRef.current?.focus();
        return;
      }
      await unlock();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setError(err.message || 'Incorrect PIN');
      setPin('');
      setSubmitting(false);
      inputRef.current?.focus();
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      `This will end ${staff?.name || 'the current'}'s shift and sign you out.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await checkOut();
            } catch (e) {
              // non-fatal — shift may already be closed
            }
            await signOut();
          },
        },
      ],
    );
  };

  return (
    <Modal visible={isLocked} animationType="fade" onRequestClose={() => {}}>
      <View style={styles.root}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>On a break</Text>
          <Text style={styles.subtitle}>
            {staff?.name || 'Cashier'} stepped away.{'\n'}Enter PIN to resume.
          </Text>

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

          <TouchableOpacity
            style={styles.signOutLink}
            onPress={handleSignOut}
            disabled={submitting}
            hitSlop={10}
          >
            <Text style={styles.signOutText}>Not you? Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  pinInput: {
    ...typography.h1,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 28,
    width: '100%',
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
    width: '100%',
  },
  errorText: { ...typography.caption, color: colors.danger, flex: 1 },

  signOutLink: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  signOutText: {
    ...typography.caption,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
});
import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

// Common Kenyan bills/quick amounts
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function CashSheet({ visible, onClose, onConfirm }) {
  const cart = useCart();
  const [tendered, setTendered] = useState('');

  // Reset when reopened
  useEffect(() => {
    if (visible) setTendered('');
  }, [visible]);

  const tenderedNum = Number(tendered) || 0;
  const total = cart.total;
  const change = tenderedNum - total;
  const enough = tenderedNum >= total;

  const append = (digit) => {
    // Prevent leading zeros and limit length
    if (tendered === '' && digit === '0') return;
    if (tendered.length >= 7) return;
    setTendered((prev) => prev + digit);
  };

  const backspace = () => setTendered((prev) => prev.slice(0, -1));
  const clear = () => setTendered('');

  const setExact = () => setTendered(String(Math.round(total)));

  const handleQuick = (amount) => {
    setTendered(String(amount));
  };

  const handleConfirm = () => {
    if (!enough) return;
    onConfirm({
      method: 'cash',
      tendered: tenderedNum,
      change,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Displays */}
        <View style={styles.displays}>
          <View style={styles.displayRow}>
            <Text style={styles.displayLabel}>Amount due</Text>
            <Text style={styles.displayValue}>{formatKES(total)}</Text>
          </View>

          <View style={styles.displayRow}>
            <Text style={styles.displayLabel}>Cash received</Text>
            <Text style={[styles.displayValue, styles.displayBig]}>
              {tendered ? formatKES(tenderedNum) : '—'}
            </Text>
          </View>

          <View
            style={[
              styles.changeRow,
              !tendered && styles.changeRowHidden,
              enough ? styles.changeRowOk : styles.changeRowWarn,
            ]}
          >
            <Text style={[styles.changeLabel, enough ? styles.changeLabelOk : styles.changeLabelWarn]}>
              {enough ? 'Change due' : 'Still needed'}
            </Text>
            <Text style={[styles.changeValue, enough ? styles.changeValueOk : styles.changeValueWarn]}>
              {formatKES(Math.abs(change))}
            </Text>
          </View>
        </View>

        {/* Quick amounts */}
        <View style={styles.quickRow}>
          <TouchableOpacity style={styles.quickChip} onPress={setExact}>
            <Text style={styles.quickChipText}>Exact</Text>
          </TouchableOpacity>

          {QUICK_AMOUNTS.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={styles.quickChip}
              onPress={() => handleQuick(amt)}
            >
              <Text style={styles.quickChipText}>{amt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {['1','2','3','4','5','6','7','8','9'].map((k) => (
            <KeyButton key={k} label={k} onPress={() => append(k)} />
          ))}
          <KeyButton label="C" onPress={clear} variant="secondary" />
          <KeyButton label="0" onPress={() => append('0')} />
          <KeyButton
            icon="backspace-outline"
            onPress={backspace}
            variant="secondary"
          />
        </View>

        {/* Confirm */}
        <TouchableOpacity
          style={[styles.confirmBtn, !enough && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!enough}
          activeOpacity={0.85}
        >
          <Ionicons
            name="checkmark-circle"
            size={22}
            color={colors.textInverse}
          />
          <Text style={styles.confirmText}>
            {enough ? `Confirm ${formatKES(total)}` : 'Enter amount'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function KeyButton({ label, icon, onPress, variant = 'primary' }) {
  return (
    <TouchableOpacity
      style={[styles.key, variant === 'secondary' && styles.keySecondary]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon ? (
        <Ionicons name={icon} size={22} color={colors.text} />
      ) : (
        <Text style={styles.keyText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
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
    paddingBottom: spacing.lg,
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

  // Displays
  displays: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  displayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  displayLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  displayValue: {
    ...typography.h3,
    color: colors.text,
  },
  displayBig: {
    ...typography.h2,
    color: colors.primary,
  },

  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  changeRowHidden: { opacity: 0.4 },
  changeRowOk: { backgroundColor: colors.successSoft },
  changeRowWarn: { backgroundColor: colors.dangerSoft },
  changeLabel: {
    ...typography.bodyMedium,
    fontWeight: '600',
  },
  changeLabelOk: { color: colors.success },
  changeLabelWarn: { color: colors.danger },
  changeValue: {
    ...typography.h3,
  },
  changeValueOk: { color: colors.success },
  changeValueWarn: { color: colors.danger },

  // Quick amounts
  quickRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipText: {
    ...typography.captionMedium,
    color: colors.text,
  },

  // Keypad
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  key: {
    width: '31%',
    aspectRatio: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keySecondary: { backgroundColor: colors.surfaceAlt },
  keyText: {
    ...typography.h3,
    color: colors.text,
  },

  // Confirm / cancel
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  confirmBtnDisabled: {
    backgroundColor: colors.borderStrong,
    opacity: 0.7,
  },
  confirmText: {
    ...typography.button,
    color: colors.textInverse,
  },

  cancelBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
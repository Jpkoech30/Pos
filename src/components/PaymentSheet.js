import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

const METHODS = [
  {
    key: 'cash',
    label: 'Cash',
    sublabel: 'Enter amount tendered',
    icon: 'cash-outline',
    color: '#059669',
    bg: '#ecfdf5',
  },
  {
    key: 'mpesa',
    label: 'M-Pesa',
    sublabel: 'Send payment request',
    icon: 'phone-portrait-outline',
    color: '#0891b2',
    bg: '#ecfeff',
  },
  {
    key: 'deni',
    label: 'Deni',
    sublabel: 'Add to customer credit',
    icon: 'book-outline',
    color: '#d97706',
    bg: '#fffbeb',
  },
];

export default function PaymentSheet({ visible, onClose, onSelect }) {
  const cart = useCart();

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

        {/* Total banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalLabel}>Amount due</Text>
          <Text style={styles.totalValue}>{formatKES(cart.total)}</Text>
        </View>

        {/* Methods */}
        <View style={styles.methods}>
          {METHODS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={styles.methodBtn}
              onPress={() => onSelect(m.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.methodIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={24} color={m.color} />
              </View>
              <View style={styles.methodBody}>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodSub}>{m.sublabel}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Modal>
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

  totalBanner: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  totalValue: {
    ...typography.display,
    color: colors.primary,
  },

  methods: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodBody: { flex: 1 },
  methodLabel: {
    ...typography.h4,
    color: colors.text,
  },
  methodSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  cancelBtn: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
});
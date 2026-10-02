import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';

export default function CartSheet({ visible, onClose, onCheckout }) {
  const {
    items, updateQty, clearCart,
    subtotal, tax, total, count,
  } = useCart();

  const handleClear = () => {
    clearCart();
    onClose();
  };

  const handlePay = () => {
    onClose();
    onCheckout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Items */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <Text style={styles.empty}>Cart is empty</Text>
            ) : (
              items.map((item) => (
                <View key={item.productId} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.unitPrice}>
                      KSh {Number(item.price).toFixed(2)} each
                    </Text>
                  </View>

                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item.productId, item.quantity - 1)}
                      hitSlop={6}
                    >
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item.productId, item.quantity + 1)}
                      hitSlop={6}
                    >
                      <Ionicons name="add" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.linePrice}>
                    KSh {(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Totals */}
          {items.length > 0 && (
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>KSh {subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>
                <Text style={styles.totalsValue}>KSh {tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.totalsRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>KSh {total.toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.clearBtn, items.length === 0 && styles.btnDisabled]}
              onPress={handleClear}
              disabled={items.length === 0}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={items.length === 0 ? colors.textMuted : colors.danger}
              />
              <Text
                style={[
                  styles.clearText,
                  items.length === 0 && styles.clearTextDisabled,
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.payBtn, items.length === 0 && styles.btnDisabled]}
              onPress={handlePay}
              disabled={items.length === 0}
            >
              <Text style={styles.payText}>Pay</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg * 2,
    borderTopRightRadius: radii.lg * 2,
    paddingBottom: spacing.lg,
    maxHeight: '85%',
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h3, color: colors.text },

  list: {
    maxHeight: 400,
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLeft: { flex: 1, marginRight: spacing.sm },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  unitPrice: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },

  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.md,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyNum: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },

  linePrice: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
  },

  totalsBox: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  totalsLabel: { ...typography.body, color: colors.textSecondary },
  totalsValue: { ...typography.body, color: colors.text },
  grandTotalRow: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  grandTotalLabel: { ...typography.h3, color: colors.text },
  grandTotalValue: { ...typography.h3, color: colors.text },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearText: {
    ...typography.button,
    color: colors.danger,
  },
  clearTextDisabled: { color: colors.textMuted },
  payBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
  },
  payText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17,
  },
  btnDisabled: { opacity: 0.4 },
});
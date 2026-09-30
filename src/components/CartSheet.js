import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  FlatList, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

export default function CartSheet({ visible, onClose, onCheckout }) {
  const cart = useCart();

  const handleClose = () => {
    if (cart.itemCount === 0) onClose();
    else onClose(); // let parent decide
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/* Backdrop — tap to close */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <View style={styles.sheet}>
        {/* Grab handle */}
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Cart</Text>
            <Text style={styles.subtitle}>
              {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              cart.clear();
              onClose();
            }}
            hitSlop={8}
            style={styles.clearBtn}
          >
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Items */}
        {cart.items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>Cart is empty</Text>
          </View>
        ) : (
          <FlatList
            data={cart.items}
            keyExtractor={(i) => i.product.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartRow
                item={item}
                onIncrement={() => cart.add(item.product)}
                onDecrement={() => cart.decrement(item.product.id)}
                onRemove={() => cart.remove(item.product.id)}
              />
            )}
          />
        )}

        {/* Footer — total + charge */}
        {cart.itemCount > 0 && (
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatKES(cart.total)}</Text>
            </View>

            <TouchableOpacity
              style={styles.chargeBtn}
              onPress={onCheckout}
              activeOpacity={0.85}
            >
              <Ionicons name="card-outline" size={20} color={colors.textInverse} />
              <Text style={styles.chargeText}>Charge {formatKES(cart.total)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

function CartRow({ item, onIncrement, onDecrement, onRemove }) {
  const { product, quantity } = item;
  const lineTotal = (Number(product.price) || 0) * quantity;

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.rowMeta}>
          {formatKES(product.price)} × {quantity}
        </Text>
      </View>

      <View style={styles.qtyControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={onDecrement}
          hitSlop={6}
        >
          <Ionicons name="remove" size={18} color={colors.primary} />
        </TouchableOpacity>

        <Text style={styles.qtyText}>{quantity}</Text>

        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={onIncrement}
          hitSlop={6}
        >
          <Ionicons name="add" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.lineTotal}>{formatKES(lineTotal)}</Text>

      <TouchableOpacity
        onPress={onRemove}
        hitSlop={8}
        style={styles.removeBtn}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
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
    maxHeight: '85%',
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
  },
  clearText: { ...typography.caption, color: colors.danger, fontWeight: '600' },

  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { ...typography.bodyMedium, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    ...typography.bodyBold,
    color: colors.primary,
    minWidth: 24,
    textAlign: 'center',
  },

  lineTotal: {
    ...typography.bodyBold,
    color: colors.text,
    minWidth: 72,
    textAlign: 'right',
  },
  removeBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.md,
  },
  emptyText: { ...typography.body, color: colors.textMuted },

  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.h2, color: colors.text },

  chargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    ...shadows.sm,
  },
  chargeText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
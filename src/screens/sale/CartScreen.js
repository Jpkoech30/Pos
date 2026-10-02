import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Button, Divider } from '../../components/ui';
import { useCart } from '../../context/CartContext';
import { colors, spacing, typography, radii } from '../../theme';

export default function CartScreen({ navigation }) {
  const { items, subtotal, increment, decrement, removeItem, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <Screen>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Cart is empty</Text>
          <Text style={styles.emptySub}>Add products to get started</Text>
          <Button
            title="Back to Sale"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.xxl }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.linePrice}>${item.price.toFixed(2)} each</Text>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => decrement(item.productId)}>
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.productId)}>
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.lineTotal}>
              ${(item.price * item.quantity).toFixed(2)}
            </Text>

            <TouchableOpacity
              onPress={() => removeItem(item.productId)}
              style={styles.trash}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <Divider />}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal ({itemCount} items)</Text>
          <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
        </View>
        <Button
          title="Charge"
          icon="card-outline"
          onPress={() => navigation.navigate('Checkout')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg },
  emptySub: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },

  list: { padding: spacing.screenPadding },
  line: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.lg },
  lineInfo: { flex: 1 },
  lineName: { ...typography.bodyBold, color: colors.text },
  linePrice: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },

  controls: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xs,
    marginRight: spacing.md,
  },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  qty: { ...typography.bodyBold, color: colors.text, minWidth: 24, textAlign: 'center' },

  lineTotal: { ...typography.bodyBold, color: colors.text, minWidth: 70, textAlign: 'right' },
  trash: { marginLeft: spacing.md },

  footer: {
    padding: spacing.screenPadding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.lg,
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.h2, color: colors.text },
});
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { productsApi } from '../services/products';
import { ordersApi } from '../services/orders';
import { useCart } from '../context/CartContext';
import ProductTile from '../components/ProductTile';
import CartSheet from '../components/CartSheet';
import PaymentSheet from '../components/PaymentSheet';
import CashSheet from '../components/CashSheet';
import MpesaSheet from '../components/MpesaSheet';
import ReceiptScreen from '../components/ReceiptScreen';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

const ALL = 'All';

export default function SaleScreen() {
  const cart = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  // Sheets
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cashOpen, setCashOpen] = useState(false);
  const [mpesaOpen, setMpesaOpen] = useState(false);

  // Receipt
  const [receipt, setReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await productsApi.list();
      setProducts(data.products || []);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load products', text2: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return [ALL, ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== ALL && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.includes(q)
      );
    });
  }, [products, category, query]);

  const qtyMap = useMemo(() => {
    const m = {};
    cart.items.forEach((i) => { m[i.product.id] = i.quantity; });
    return m;
  }, [cart.items]);

  const handleAdd = (product) => {
    cart.add(product);
    Keyboard.dismiss();
  };

  // --- Payment flow ---

  const handleSelectPayment = (method) => {
    setPaymentOpen(false);
    if (method === 'cash') return setCashOpen(true);
    if (method === 'mpesa') return setMpesaOpen(true);

    Toast.show({ type: 'info', text1: `${method.toUpperCase()} flow`, text2: 'Coming next' });
  };

  const submitOrder = async ({ method, extras = {} }) => {
    try {
      setSubmitting(true);

      const items = cart.items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: Number(i.product.price),
        quantity: i.quantity,
      }));

      const { order } = await ordersApi.create(items, method);

      // Freeze a receipt snapshot before clearing the cart
      setReceipt({
        id: order?.id,
        items,
        subtotal: order?.subtotal ?? cart.subtotal,
        total: order?.total ?? cart.total,
        paymentMethod: method,
        createdAt: order?.createdAt || new Date().toISOString(),
        ...extras,
      });

      // Close all sheets, open receipt
      setCashOpen(false);
      setMpesaOpen(false);
      setReceiptOpen(true);

      // Clear cart immediately — receipt already has its own copy
      cart.clear();

      // Refresh products in background (stock may have changed)
      loadProducts();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save sale', text2: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashConfirm = ({ tendered, change }) => {
    submitOrder({ method: 'cash', extras: { tendered, change } });
  };

  const handleMpesaConfirm = ({ phone }) => {
    submitOrder({ method: 'mpesa', extras: { phone } });
  };

  const handleReceiptDone = () => {
    setReceiptOpen(false);
    setReceipt(null);
  };

  // --- Render ---

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* CATEGORY CHIPS */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        renderItem={({ item }) => {
          const active = item === category;
          return (
            <TouchableOpacity
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* PRODUCT GRID */}
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {query ? 'No products match your search' : 'No products yet'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductTile
            product={item}
            quantity={qtyMap[item.id] || 0}
            onPress={() => handleAdd(item)}
          />
        )}
      />

      {/* CART BAR */}
      {cart.itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          activeOpacity={0.9}
          onPress={() => setCartOpen(true)}
        >
          <View style={styles.cartLeft}>
            <View style={styles.cartIconWrap}>
              <Ionicons name="cart" size={20} color={colors.textInverse} />
            </View>
            <View>
              <Text style={styles.cartCount}>
                {cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}
              </Text>
              <Text style={styles.cartHint}>Tap to review</Text>
            </View>
          </View>

          <View style={styles.cartRight}>
            <Text style={styles.cartTotal}>{formatKES(cart.total)}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textInverse} />
          </View>
        </TouchableOpacity>
      )}

      {/* SHEETS */}
      <CartSheet
        visible={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setPaymentOpen(true);
        }}
      />

      <PaymentSheet
        visible={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onSelect={handleSelectPayment}
      />

      <CashSheet
        visible={cashOpen}
        onClose={() => setCashOpen(false)}
        onConfirm={handleCashConfirm}
      />

      <MpesaSheet
        visible={mpesaOpen}
        onClose={() => setMpesaOpen(false)}
        onConfirm={handleMpesaConfirm}
      />

      <ReceiptScreen
        visible={receiptOpen}
        receipt={receipt}
        onDone={handleReceiptDone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: radii.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 0,
  },

  chipsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },

  grid: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
  },

  empty: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },

  cartBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.lg,
  },
  cartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cartIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCount: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  cartHint: {
    ...typography.tiny,
    color: '#c7d2fe',
    marginTop: 2,
  },
  cartRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartTotal: {
    ...typography.h3,
    color: colors.textInverse,
  },
});
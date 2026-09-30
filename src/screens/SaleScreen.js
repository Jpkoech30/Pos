import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { productsApi } from '../services/products';
import ProductTile from '../components/ProductTile';
import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii, shadows } from '../theme';

const { width } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const TILE_GAP = spacing.sm;

export default function SaleScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { items, addToCart, count, subtotal } = useCart();

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await productsApi.list();
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
      if (isRefresh) {
        Toast.show({ type: 'error', text1: 'Refresh failed', text2: err.message });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Toast.show({ type: 'info', text1: 'Cart is empty' });
      return;
    }
    navigation.navigate('Checkout');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Couldn't load products</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadProducts()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>New Sale</Text>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('Scanner', { purpose: 'sale' })}
        >
          <Ionicons name="barcode-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Product grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.tileWrap}>
            <ProductTile
              product={item}
              onPress={() => addToCart(item)}
            />
          </View>
        )}
      />

      {/* Cart bar */}
      {items.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.cartTotal}>${subtotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Charge</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl,
  },
  errorTitle: {
    ...typography.h3, color: colors.text,
    marginTop: spacing.md, marginBottom: spacing.xs,
  },
  errorMsg: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginBottom: spacing.xl,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    borderRadius: radii.sm,
  },
  retryText: { ...typography.button, color: colors.textInverse },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  scanButton: {
    width: 40, height: 40, borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },

  grid: {
    paddingHorizontal: spacing.screenPadding - TILE_GAP,
    paddingBottom: spacing.xxxl,
  },
  row: {
    justifyContent: 'space-between',
  },
  tileWrap: {
    flex: 1 / NUM_COLUMNS,
    maxWidth: '50%',
  },

  cartBar: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    bottom: spacing.screenPadding,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.lg,
  },
  cartInfo: { flex: 1, marginLeft: spacing.sm },
  cartCount: {
    ...typography.caption, color: colors.textSecondary,
  },
  cartTotal: {
    ...typography.h3, color: colors.text, marginTop: 2,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  checkoutText: {
    ...typography.button, color: colors.textInverse,
  },
});
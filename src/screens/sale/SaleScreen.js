import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { productsApi } from '../../services/products';
import ProductTile from '../../components/ProductTile';
import CheckInSheet from '../../components/CheckInSheet';
import LockOverlay from '../../components/LockOverlay';
import { useCart } from '../../context/CartContext';
import { useShift } from '../../context/ShiftContext';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const NUM_COLUMNS = 2;
const SKELETON_COUNT = 6;

export default function SaleScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [sheetMode, setSheetMode] = useState(null);
  const [pendingIntent, setPendingIntent] = useState(null);

  const { items, addToCart, updateQty, removeItem, count, total } = useCart();
  const { staff, staffCount } = useShift();

  const qtyByProduct = useMemo(() => {
    const map = {};
    items.forEach((i) => { map[i.productId] = i.quantity; });
    return map;
  }, [items]);

  const needsCheckIn = staffCount >= 2 && !staff;

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

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'All' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').includes(q)
      );
    });
  }, [products, search, category]);

  const handleAdd = (product) => {
    Haptics.selectionAsync().catch(() => {});
    addToCart(product);
  };

  const handleRemoveOne = (product) => {
    const current = qtyByProduct[product.id] || 0;
    Haptics.selectionAsync().catch(() => {});
    if (current <= 1) removeItem(product.id);
    else updateQty(product.id, current - 1);
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Toast.show({ type: 'info', text1: 'Cart is empty' });
      return;
    }
    if (needsCheckIn) {
      setPendingIntent('checkout');
      setSheetMode('checkin');
      return;
    }
    navigation.navigate('Checkout');
  };

  const handleSheetClose = () => {
    setSheetMode(null);
    setPendingIntent(null);
  };

  const handleSheetSuccess = () => {
    const wasPending = pendingIntent === 'checkout';
    setSheetMode(null);
    setPendingIntent(null);
    if (wasPending) navigation.navigate('Checkout');
  };

  const handleEndShift = () => {
    navigation.navigate('CloseShift');
  };

  const openShiftSheet = () => {
    setSheetMode(staff ? 'checkout' : 'checkin');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>New Sale</Text>
        </View>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <View style={styles.searchSkeleton} />
        </View>
        <View style={styles.skeletonGrid}>
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <View key={i} style={styles.skeletonTileWrap}>
              <View style={styles.skeletonTile} />
            </View>
          ))}
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
      <View style={styles.header}>
        <Text style={styles.title}>New Sale</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.shiftPill, staff && styles.shiftPillActive]}
            onPress={openShiftSheet}
            activeOpacity={0.8}
          >
            <Ionicons
              name={staff ? 'person' : 'person-outline'}
              size={14}
              color={staff ? '#fff' : colors.primary}
            />
            <Text
              style={[styles.shiftText, staff && styles.shiftTextActive]}
              numberOfLines={1}
            >
              {staff ? staff.name.split(' ')[0] : 'Check in'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => navigation.navigate('Scanner', { purpose: 'sale' })}
            activeOpacity={0.85}
          >
            <Ionicons name="barcode-outline" size={18} color={colors.primary} />
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {categories.map((c) => {
          const active = category === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setCategory(c)}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {search ? `No products match "${search}"` : 'No products in this category'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.tileWrap}>
            <ProductTile
              product={item}
              quantity={qtyByProduct[item.id] || 0}
              onPress={handleAdd}
              onLongPress={handleRemoveOne}
            />
          </View>
        )}
      />

      {items.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.cartTotal}>{formatKsh(total)}</Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckout}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutText}>Charge</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <CheckInSheet
        visible={sheetMode !== null}
        mode={sheetMode || 'checkin'}
        onClose={handleSheetClose}
        onSuccess={handleSheetSuccess}
        onEndShift={handleEndShift}
      />
      <LockOverlay />
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
  retryText: { ...typography.button, color: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text, flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
  },
  scanButtonText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },

  shiftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    maxWidth: 140,
  },
  shiftPillActive: { backgroundColor: colors.primary },
  shiftText: {
    ...typography.tiny, color: colors.primary, fontWeight: '700',
  },
  shiftTextActive: { color: '#fff' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.screenPadding,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radii.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  searchSkeleton: {
    flex: 1,
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.border,
    opacity: 0.4,
  },

  chipsScroll: { flexGrow: 0, marginTop: spacing.md, marginBottom: spacing.sm },
  chipsRow: { paddingHorizontal: spacing.screenPadding, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: {
    ...typography.caption, color: colors.textSecondary, fontWeight: '600',
  },
  chipTextActive: { color: '#fff' },

  list: { flex: 1 },
  grid: {
    paddingHorizontal: spacing.screenPadding - spacing.sm / 2,
    paddingBottom: spacing.xxxl,
  },
  row: { justifyContent: 'space-between' },
  tileWrap: { flex: 1 / NUM_COLUMNS, maxWidth: '50%' },

  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding - spacing.sm / 2,
    marginTop: spacing.md,
  },
  skeletonTileWrap: {
    width: '50%',
    padding: spacing.sm / 2,
  },
  skeletonTile: {
    height: 132,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    opacity: 0.7,
  },

  emptyBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    ...typography.body, color: colors.textSecondary,
    marginTop: spacing.md, textAlign: 'center',
  },

  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenPadding,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  cartInfo: { flex: 1 },
  cartCount: { ...typography.caption, color: colors.textMuted },
  cartTotal: { ...typography.price, color: colors.text, marginTop: 2 },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    height: 44,
    borderRadius: radii.md, gap: spacing.sm,
  },
  checkoutText: { ...typography.button, color: '#fff' },
});
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

import { productsApi } from '../../services/products';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const CATEGORY_META = {
  Coffee:         { icon: 'cafe-outline',       color: '#92400e', bg: '#fef3c7' },
  Grocery:        { icon: 'basket-outline',     color: '#065f46', bg: '#d1fae5' },
  Drinks:         { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Snacks:         { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  'Personal care':{ icon: 'heart-outline',      color: '#9d174d', bg: '#fce7f3' },
  Household:      { icon: 'home-outline',       color: '#5b21b6', bg: '#ede9fe' },
  Pastry:         { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  Sandwich:       { icon: 'restaurant-outline', color: '#065f46', bg: '#d1fae5' },
  Salad:          { icon: 'leaf-outline',       color: '#166534', bg: '#dcfce7' },
  Drink:          { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Default:        { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
};

const LOW_STOCK_THRESHOLD = 10;
const HINT_KEY = 'products_onboarding_dismissed';

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [quickFilter, setQuickFilter] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await productsApi.list();
      setProducts(data.products || []);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load', text2: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    (async () => {
      const dismissed = await AsyncStorage.getItem(HINT_KEY);
      if (!dismissed) setShowHint(true);
    })();
  }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(true));
    return unsub;
  }, [navigation, load]);

  const dismissHint = async () => {
    setShowHint(false);
    await AsyncStorage.setItem(HINT_KEY, 'true');
  };

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const stats = useMemo(() => {
    let low = 0, out = 0;
    products.forEach((p) => {
      const s = Number(p.stock);
      if (s <= 0) out += 1;
      else if (s < LOW_STOCK_THRESHOLD) low += 1;
    });
    return { total: products.length, low, out };
  }, [products]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (quickFilter === 'low') {
        const s = Number(p.stock);
        if (s <= 0 || s >= LOW_STOCK_THRESHOLD) return false;
      } else if (quickFilter === 'out') {
        if (Number(p.stock) > 0) return false;
      } else if (category !== 'All' && p.category !== category) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').includes(q)
      );
    });
  }, [products, search, category, quickFilter]);

  const handleQuickFilter = (type) => {
    if (type === 'low' && stats.low === 0) return;
    if (type === 'out' && stats.out === 0) return;
    setQuickFilter(quickFilter === type ? null : type);
    setCategory('All');
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = products.length === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ProductForm')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Onboarding hint — first visit only */}
      {showHint && !isEmpty && (
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.hintBody}>
            <Text style={styles.hintTitle}>Adding products is easy</Text>
            <Text style={styles.hintText}>
              Tap + and start typing a product name. We'll suggest a match from
              200+ Kenyan products with a price you can edit.
            </Text>
          </View>
          <TouchableOpacity onPress={dismissHint} hitSlop={10}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {isEmpty ? (
        <EmptyState navigation={navigation} />
      ) : (
        <>
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search your products…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Inventory pulse */}
          {products.length > 0 && (
            <View style={styles.pulseRow}>
              <Text style={styles.pulseText}>
                {stats.total} {stats.total === 1 ? 'product' : 'products'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pulseChip,
                  stats.low > 0 && styles.pulseChipWarn,
                  quickFilter === 'low' && styles.pulseChipActive,
                ]}
                onPress={() => handleQuickFilter('low')}
                disabled={stats.low === 0}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: stats.low > 0 ? colors.warning : colors.border },
                  ]}
                />
                <Text
                  style={[
                    styles.pulseChipText,
                    stats.low > 0 && styles.pulseChipTextWarn,
                    quickFilter === 'low' && styles.pulseChipTextActive,
                  ]}
                >
                  {stats.low} low
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pulseChip,
                  stats.out > 0 && styles.pulseChipDanger,
                  quickFilter === 'out' && styles.pulseChipActive,
                ]}
                onPress={() => handleQuickFilter('out')}
                disabled={stats.out === 0}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: stats.out > 0 ? colors.danger : colors.border },
                  ]}
                />
                <Text
                  style={[
                    styles.pulseChipText,
                    stats.out > 0 && styles.pulseChipTextDanger,
                    quickFilter === 'out' && styles.pulseChipTextActive,
                  ]}
                >
                  {stats.out} out
                </Text>
              </TouchableOpacity>

              {quickFilter && (
                <TouchableOpacity
                  style={styles.clearFilter}
                  onPress={() => setQuickFilter(null)}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {!quickFilter && categories.length > 1 && (
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
          )}

          <FlatList
            style={styles.list}
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>
                  {search
                    ? `No products match "${search}"`
                    : quickFilter === 'low'
                    ? 'No low-stock products'
                    : quickFilter === 'out'
                    ? 'Nothing out of stock'
                    : 'No products in this category'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <ProductRow
                product={item}
                onPress={() =>
                  navigation.navigate('ProductDetail', { product: item })
                }
              />
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function EmptyState({ navigation }) {
  return (
    <ScrollView
      contentContainerStyle={styles.emptyScroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.emptyHero}>
        <View style={styles.emptyIcon}>
          <Ionicons name="storefront-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Let's stock your shop</Text>
        <Text style={styles.emptySub}>
          Add your first product and you're ready to sell. We've already
          pre-loaded 200+ common Kenyan products to speed this up.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.emptyPrimaryBtn}
        onPress={() => navigation.navigate('ProductForm')}
        activeOpacity={0.85}
      >
        <View style={styles.emptyBtnIcon}>
          <Ionicons name="search" size={20} color="#fff" />
        </View>
        <View style={styles.emptyBtnBody}>
          <Text style={styles.emptyBtnTitle}>Search 200+ products</Text>
          <Text style={styles.emptyBtnSub}>
            Fresh Fri, Zesta, OMO, Brookside, Coca-Cola…
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>

      <View style={styles.emptyDivider}>
        <View style={styles.emptyDividerLine} />
        <Text style={styles.emptyDividerText}>or</Text>
        <View style={styles.emptyDividerLine} />
      </View>

      <TouchableOpacity
        style={styles.emptySecondaryBtn}
        onPress={() => navigation.navigate('ProductForm')}
        activeOpacity={0.85}
      >
        <Ionicons name="create-outline" size={20} color={colors.primary} />
        <Text style={styles.emptySecondaryText}>Add manually from scratch</Text>
      </TouchableOpacity>

      <View style={styles.emptyTips}>
        <Text style={styles.emptyTipsTitle}>Tips for getting started</Text>
        <View style={styles.emptyTipRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.emptyTipText}>
            Scan a barcode — the app fills in details automatically
          </Text>
        </View>
        <View style={styles.emptyTipRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.emptyTipText}>
            Always add a cost price — it powers your profit reports
          </Text>
        </View>
        <View style={styles.emptyTipRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.emptyTipText}>
            Leave stock at zero — you can update it later
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ProductRow({ product, onPress }) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.Default;
  const stock = Number(product.stock);
  const price = Number(product.price);
  const cost = product.costPrice != null ? Number(product.costPrice) : null;

  const stockBadge =
    stock <= 0
      ? { text: 'Out', color: colors.danger, bg: colors.dangerSoft }
      : stock < LOW_STOCK_THRESHOLD
      ? { text: `${stock} left`, color: colors.warning, bg: colors.warningSoft }
      : null;

  const margin = cost != null && price > 0
    ? Math.round(((price - cost) / price) * 100)
    : null;
  const marginLow = margin != null && margin < 20;
  const out = stock <= 0;

  return (
    <TouchableOpacity
      style={[styles.row, out && styles.rowOut]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.rowIcon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {product.name}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowCategory}>{product.category}</Text>
          {stockBadge && (
            <View style={[styles.badge, { backgroundColor: stockBadge.bg }]}>
              <Text style={[styles.badgeText, { color: stockBadge.color }]}>
                {stockBadge.text}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{formatKsh(price)}</Text>
        {margin != null && (
          <View style={[styles.marginBadge, marginLow && styles.marginBadgeLow]}>
            <Text style={[styles.marginText, marginLow && styles.marginTextLow]}>
              {margin}%
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },
  addBtn: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },

  // Onboarding hint
  hintCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.lg,
  },
  hintIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  hintBody: { flex: 1 },
  hintTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  hintText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

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
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },

  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  pulseText: { ...typography.caption, color: colors.textMuted },
  pulseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  pulseChipWarn: { backgroundColor: colors.warningSoft, borderColor: 'transparent' },
  pulseChipDanger: { backgroundColor: colors.dangerSoft, borderColor: 'transparent' },
  pulseChipActive: { borderColor: colors.primary, borderWidth: 1.5 },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  pulseChipText: { ...typography.tiny, color: colors.textMuted, fontWeight: '600' },
  pulseChipTextWarn: { color: colors.warning },
  pulseChipTextDanger: { color: colors.danger },
  pulseChipTextActive: { fontWeight: '700' },
  clearFilter: { marginLeft: 'auto' },

  chipsScroll: { flexGrow: 0, marginTop: spacing.md },
  chipsRow: { paddingHorizontal: spacing.screenPadding, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  rowOut: { opacity: 0.55 },
  rowIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowName: { ...typography.bodyMedium, color: colors.text, fontWeight: '600' },
  rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: spacing.sm },
  rowCategory: { ...typography.tiny, color: colors.textMuted },
  badge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText: { ...typography.tiny, fontSize: 10, fontWeight: '700' },

  rowRight: { alignItems: 'flex-end', gap: 3, minWidth: 80 },
  rowPrice: { ...typography.bodyMedium, color: colors.text, fontWeight: '700' },
  marginBadge: {
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.successSoft,
  },
  marginBadgeLow: { backgroundColor: colors.warningSoft },
  marginText: { ...typography.tiny, fontSize: 10, color: colors.success, fontWeight: '700' },
  marginTextLow: { color: colors.warning },

  emptyBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body, color: colors.textSecondary,
    marginTop: spacing.md, textAlign: 'center',
  },

  // Empty state
  emptyScroll: {
    padding: spacing.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  emptyHero: { alignItems: 'center', marginBottom: spacing.xxl },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: 'center' },
  emptySub: {
    ...typography.body, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sm,
    maxWidth: 320, lineHeight: 22,
  },

  emptyPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  emptyBtnIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyBtnBody: { flex: 1 },
  emptyBtnTitle: { ...typography.bodyMedium, color: '#fff', fontWeight: '700' },
  emptyBtnSub: {
    ...typography.tiny, color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  emptyDivider: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginVertical: spacing.lg,
  },
  emptyDividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  emptyDividerText: { ...typography.caption, color: colors.textMuted },

  emptySecondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  emptySecondaryText: {
    ...typography.bodyMedium, color: colors.primary, fontWeight: '600',
  },

  emptyTips: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    gap: spacing.md,
  },
  emptyTipsTitle: {
    ...typography.caption, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyTipRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.sm,
  },
  emptyTipText: {
    ...typography.caption, color: colors.textSecondary,
    flex: 1, lineHeight: 18,
  },
});
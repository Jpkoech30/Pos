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
import ProductListRow from '../../components/ProductListRow';
import StockAdjustSheet from '../../components/StockAdjustSheet';
import FilterSheet from '../../components/FilterSheet';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const HINT_KEY = 'products_onboarding_dismissed';
const LOW_STOCK_THRESHOLD = 10;

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('catalog');
  const [stockTarget, setStockTarget] = useState(null);

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

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(true));
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const handleStockSave = async (product, nextStock) => {
    await productsApi.update(product.id, { stock: nextStock });
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: nextStock } : p)),
    );
    Toast.show({
      type: 'success',
      text1: 'Stock updated',
      text2: `${product.name} → ${nextStock}`,
    });
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('ProductForm')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Segmented control */}
      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, view === 'catalog' && styles.segmentBtnActive]}
          onPress={() => setView('catalog')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              view === 'catalog' && styles.segmentTextActive,
            ]}
          >
            Catalog
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, view === 'stock' && styles.segmentBtnActive]}
          onPress={() => setView('stock')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.segmentText,
              view === 'stock' && styles.segmentTextActive,
            ]}
          >
            Stock
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'catalog' ? (
        <CatalogView
          products={products}
          navigation={navigation}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onStockPress={setStockTarget}
        />
      ) : (
        <StockView
          products={products}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onStockPress={setStockTarget}
        />
      )}

      <StockAdjustSheet
        visible={!!stockTarget}
        product={stockTarget}
        onClose={() => setStockTarget(null)}
        onSave={handleStockSave}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Catalog view (existing)
// ─────────────────────────────────────────────
function CatalogView({
  products, navigation, refreshing, onRefresh, onStockPress,
}) {
  const [search, setSearch] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [filters, setFilters] = useState({
    category: null,
    stock: 'all',
    margin: 'all',
  });
  const [sort, setSort] = useState('name');
  const [showFilters, setShowFilters] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    (async () => {
      const dismissed = await AsyncStorage.getItem(HINT_KEY);
      if (!dismissed) setShowHint(true);
    })();
  }, []);

  const dismissHint = async () => {
    setShowHint(false);
    await AsyncStorage.setItem(HINT_KEY, 'true');
  };

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => p.category && set.add(p.category));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cat = filters.category || [];
    const stock = filters.stock || 'all';
    const margin = filters.margin || 'all';

    const out = products.filter((p) => {
      const stockN = Number(p.stock);
      const priceN = Number(p.price);
      const costN = p.costPrice != null ? Number(p.costPrice) : null;
      const marginPct =
        costN != null && priceN > 0 ? ((priceN - costN) / priceN) * 100 : null;

      if (cat.length && !cat.includes(p.category)) return false;
      if (stock === 'in' && stockN <= 0) return false;
      if (stock === 'low' && (stockN <= 0 || stockN >= LOW_STOCK_THRESHOLD)) return false;
      if (stock === 'out' && stockN > 0) return false;
      if (margin === 'nocost' && costN != null) return false;
      if (margin === 'under10' && (marginPct == null || marginPct >= 10)) return false;
      if (margin === '10to30' && (marginPct == null || marginPct < 10 || marginPct >= 30)) return false;
      if (margin === 'over30' && (marginPct == null || marginPct < 30)) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').includes(q)
      );
    });

    out.sort((a, b) => {
      switch (sort) {
        case 'recent': return Number(b.id) - Number(a.id);
        case 'priceHigh': return Number(b.price) - Number(a.price);
        case 'priceLow': return Number(a.price) - Number(b.price);
        case 'stockLow': return Number(a.stock) - Number(b.stock);
        default: return a.name.localeCompare(b.name);
      }
    });
    return out;
  }, [products, search, filters, sort]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.category?.length) n += 1;
    if (filters.stock && filters.stock !== 'all') n += 1;
    if (filters.margin && filters.margin !== 'all') n += 1;
    return n;
  }, [filters]);

  const stats = useMemo(() => {
    let low = 0, out = 0;
    products.forEach((p) => {
      const s = Number(p.stock);
      if (s <= 0) out += 1;
      else if (s < LOW_STOCK_THRESHOLD) low += 1;
    });
    return { total: products.length, low, out };
  }, [products]);

  const enterSelection = (id) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };
  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };
  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map((id) => productsApi.remove(id)));
      Toast.show({
        type: 'success',
        text1: `Deleted ${ids.length}`,
      });
      exitSelection();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: err.message });
    }
  };

  if (products.length === 0) {
    return (
      <View style={styles.emptyHero}>
        <View style={styles.emptyIcon}>
          <Ionicons name="storefront-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Let's stock your shop</Text>
        <Text style={styles.emptySub}>
          Add your first product. We've pre-loaded 200+ common Kenyan products.
        </Text>
        <TouchableOpacity
          style={styles.emptyPrimaryBtn}
          onPress={() => navigation.navigate('ProductForm')}
          activeOpacity={0.85}
        >
          <Ionicons name="search" size={20} color="#fff" />
          <Text style={styles.emptyBtnTitle}>Search 200+ products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (selectionMode) {
    return (
      <>
        <View style={styles.selectionBar}>
          <TouchableOpacity onPress={exitSelection} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.selectionCount}>{selectedIds.size} selected</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          style={styles.list}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductListRow
              product={item}
              selectionMode
              selected={selectedIds.has(item.id)}
              onPress={() => toggleSelection(item.id)}
            />
          )}
        />

        <View style={styles.bulkBar}>
          <TouchableOpacity
            style={styles.bulkDelete}
            onPress={handleBulkDelete}
            activeOpacity={0.85}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.bulkDeleteText}>
              Delete {selectedIds.size}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      {showHint && (
        <View style={styles.hintCard}>
          <View style={styles.hintIcon}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.hintBody}>
            <Text style={styles.hintTitle}>Adding products is easy</Text>
            <Text style={styles.hintText}>
              Tap + and type a name. Tap <Text style={{ fontWeight: '700' }}>+ Stock</Text> to update inventory. Long-press to select multiple.
            </Text>
          </View>
          <TouchableOpacity onPress={dismissHint} hitSlop={10}>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchRow}>
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
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setShowFilters(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? '#fff' : colors.textSecondary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.pulseRow}>
        <Text style={styles.pulseText}>
          {filtered.length} of {stats.total}
        </Text>
        {stats.low > 0 && (
          <View style={[styles.pulseChip, styles.pulseChipWarn]}>
            <View style={[styles.pulseDot, { backgroundColor: colors.warning }]} />
            <Text style={[styles.pulseChipText, { color: colors.warning }]}>
              {stats.low} low
            </Text>
          </View>
        )}
        {stats.out > 0 && (
          <View style={[styles.pulseChip, styles.pulseChipDanger]}>
            <View style={[styles.pulseDot, { backgroundColor: colors.danger }]} />
            <Text style={[styles.pulseChipText, { color: colors.danger }]}>
              {stats.out} out
            </Text>
          </View>
        )}
      </View>

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
              {search ? `No products match "${search}"` : 'No products match these filters'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductListRow
            product={item}
            onPress={() =>
              selectionMode ? toggleSelection(item.id) : navigation.navigate('ProductDetail', { product: item })
            }
            onLongPress={() => !selectionMode && enterSelection(item.id)}
            onStockPress={() => onStockPress(item)}
          />
        )}
      />

      <FilterSheet
        visible={showFilters}
        categories={categories}
        filters={filters}
        sort={sort}
        onApply={(f, s) => {
          setFilters(f);
          setSort(s);
        }}
        onClose={() => setShowFilters(false)}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Stock view (new)
// ─────────────────────────────────────────────
function StockView({ products, refreshing, onRefresh, onStockPress }) {
  const [subView, setSubView] = useState('attention');

  const stats = useMemo(() => {
    let totalValue = 0;
    let lowItems = [];
    let outItems = [];

    products.forEach((p) => {
      const stock = Number(p.stock);
      const cost = p.costPrice != null ? Number(p.costPrice) : Number(p.price) * 0.6;

      if (stock > 0) {
        totalValue += cost * stock;
      }

      if (stock <= 0) {
        outItems.push(p);
      } else if (stock < LOW_STOCK_THRESHOLD) {
        lowItems.push(p);
      }
    });

    // Sort low items by stock ascending — most urgent first
    lowItems.sort((a, b) => Number(a.stock) - Number(b.stock));
    // Sort out items alphabetically
    outItems.sort((a, b) => a.name.localeCompare(b.name));

    return {
      totalValue: +totalValue.toFixed(2),
      totalItems: products.length,
      lowCount: lowItems.length,
      outCount: outItems.length,
      lowItems,
      outItems,
    };
  }, [products]);

  const allSorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const sa = Number(a.stock);
      const sb = Number(b.stock);
      if (sa <= 0 && sb > 0) return -1;
      if (sa > 0 && sb <= 0) return 1;
      return sa - sb;
    });
  }, [products]);

  const listData =
    subView === 'attention'
      ? [...stats.outItems, ...stats.lowItems]
      : allSorted;

  return (
    <ScrollView
      style={styles.stockScroll}
      contentContainerStyle={styles.stockScrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Summary cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
          <Text style={styles.summaryLabelLight}>Stock value</Text>
          <Text style={styles.summaryValueLight}>
            {formatKsh(stats.totalValue)}
          </Text>
          <Text style={styles.summarySubLight}>
            across {stats.totalItems} {stats.totalItems === 1 ? 'item' : 'items'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryCardWarn]}>
            <View style={styles.summaryIconRow}>
              <Ionicons name="alert-circle" size={16} color={colors.warning} />
              <Text style={styles.summaryLabel}>Low stock</Text>
            </View>
            <Text style={styles.summaryValue}>{stats.lowCount}</Text>
          </View>

          <View style={[styles.summaryCard, styles.summaryCardDanger]}>
            <View style={styles.summaryIconRow}>
              <Ionicons name="close-circle" size={16} color={colors.danger} />
              <Text style={styles.summaryLabel}>Out</Text>
            </View>
            <Text style={styles.summaryValue}>{stats.outCount}</Text>
          </View>
        </View>
      </View>

      {/* Sub-view toggle */}
      <View style={styles.subToggle}>
        <TouchableOpacity
          style={[styles.subToggleBtn, subView === 'attention' && styles.subToggleBtnActive]}
          onPress={() => setSubView('attention')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.subToggleText,
              subView === 'attention' && styles.subToggleTextActive,
            ]}
          >
            Needs attention
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subToggleBtn, subView === 'all' && styles.subToggleBtnActive]}
          onPress={() => setSubView('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.subToggleText,
              subView === 'all' && styles.subToggleTextActive,
            ]}
          >
            All stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {listData.length === 0 ? (
        <View style={styles.stockEmpty}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.stockEmptyTitle}>Everything is stocked</Text>
          <Text style={styles.stockEmptySub}>
            No items are running low. Nice work.
          </Text>
        </View>
      ) : (
        listData.map((p) => (
          <StockRow
            key={p.id}
            product={p}
            onRestock={() => onStockPress(p)}
          />
        ))
      )}

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

function StockRow({ product, onRestock }) {
  const stock = Number(product.stock);
  const out = stock <= 0;
  const low = !out && stock < LOW_STOCK_THRESHOLD;

  const statusColor = out
    ? colors.danger
    : low
    ? colors.warning
    : colors.textMuted;

  const statusText = out
    ? 'Out of stock'
    : low
    ? `${stock} left — running low`
    : `${stock} in stock`;

  return (
    <View style={styles.stockRow}>
      <View style={[styles.stockIndicator, { backgroundColor: statusColor }]} />
      <View style={styles.stockRowBody}>
        <Text style={styles.stockRowName} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={[styles.stockRowStatus, { color: statusColor }]} numberOfLines={1}>
          {statusText}
        </Text>
        <Text style={styles.stockRowCategory} numberOfLines={1}>
          {product.category}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.restockBtn}
        onPress={onRestock}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={styles.restockText}>Restock</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text, flex: 1 },
  addBtn: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },

  // Segmented control
  segment: {
    flexDirection: 'row',
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#fff',
  },

  // Selection mode bar
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  selectionCount: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },

  // Hint
  hintCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    marginHorizontal: spacing.screenPadding, marginBottom: spacing.md,
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
    ...typography.bodyMedium, color: colors.text, fontWeight: '700',
  },
  hintText: {
    ...typography.caption, color: colors.textSecondary,
    marginTop: 2, lineHeight: 18,
  },

  // Search
  searchRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
  },
  searchWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    height: 44, borderRadius: radii.md, gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  filterBtn: {
    width: 44, height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    ...typography.tiny, color: '#fff',
    fontWeight: '800', fontSize: 10,
  },

  pulseRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  pulseText: { ...typography.caption, color: colors.textMuted },
  pulseChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radii.pill, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  pulseChipWarn: { backgroundColor: colors.warningSoft, borderColor: 'transparent' },
  pulseChipDanger: { backgroundColor: colors.dangerSoft, borderColor: 'transparent' },
  pulseDot: { width: 6, height: 6, borderRadius: 3 },
  pulseChipText: { ...typography.tiny, fontWeight: '600' },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },
  emptyBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    ...typography.body, color: colors.textSecondary,
    marginTop: spacing.md, textAlign: 'center',
  },

  // Bulk bar
  bulkBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.screenPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  bulkDelete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg, borderRadius: radii.md,
    backgroundColor: colors.danger,
  },
  bulkDeleteText: { ...typography.button, color: '#fff', fontSize: 16 },

  // Empty hero
  emptyHero: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
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
    maxWidth: 320, lineHeight: 22, marginBottom: spacing.xxl,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    ...shadows.md,
  },
  emptyBtnTitle: { ...typography.bodyMedium, color: '#fff', fontWeight: '700' },

  // ─── Stock view ───
  stockScroll: { flex: 1 },
  stockScrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
  },

  summaryGrid: { gap: spacing.sm, marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  summaryCardPrimary: {
    backgroundColor: colors.primary,
  },
  summaryCardWarn: {
    backgroundColor: colors.warningSoft,
  },
  summaryCardDanger: {
    backgroundColor: colors.dangerSoft,
  },
  summaryLabelLight: {
    ...typography.tiny, color: 'rgba(255,255,255,0.8)',
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },
  summaryValueLight: {
    ...typography.h1, color: '#fff', fontSize: 30,
    marginTop: spacing.xs,
  },
  summarySubLight: {
    ...typography.caption, color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  summaryIconRow: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.tiny, color: colors.text,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },
  summaryValue: {
    ...typography.h2, color: colors.text,
  },

  // Sub-toggle
  subToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  subToggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  subToggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subToggleText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  subToggleTextActive: { color: '#fff' },

  // Stock rows
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  stockIndicator: {
    width: 4,
    height: 44,
    borderRadius: 2,
  },
  stockRowBody: {
    flex: 1, minWidth: 0, gap: 2,
  },
  stockRowName: {
    ...typography.bodyMedium, color: colors.text, fontWeight: '600',
  },
  stockRowStatus: {
    ...typography.tiny, fontWeight: '700',
  },
  stockRowCategory: {
    ...typography.tiny, color: colors.textMuted,
  },
  restockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  restockText: {
    ...typography.tiny, color: '#fff', fontWeight: '700', fontSize: 12,
  },

  stockEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  stockEmptyTitle: {
    ...typography.h3, color: colors.text, marginTop: spacing.md,
  },
  stockEmptySub: {
    ...typography.caption, color: colors.textMuted, marginTop: spacing.xs,
  },
});
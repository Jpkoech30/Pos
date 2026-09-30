import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Screen, Card } from '../components/ui';
import { productsApi } from '../services/products';
import { colors, spacing, typography, radii } from '../theme';

const CATEGORY_META = {
  Coffee:    { icon: 'cafe-outline',       color: '#92400e', bg: '#fef3c7' },
  Pastry:    { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  Sandwich:  { icon: 'restaurant-outline', color: '#065f46', bg: '#d1fae5' },
  Salad:     { icon: 'leaf-outline',       color: '#166534', bg: '#dcfce7' },
  Drink:     { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Default:   { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
};

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

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

  // reload on focus (after add/edit)
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => loadProducts());
    return unsub;
  }, [navigation, loadProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === 'All' || p.category === category;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    });
  }, [products, query, category]);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  if (error && products.length === 0) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Couldn't load products</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => loadProducts()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>{filtered.length} of {products.length}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProductForm')}
          style={styles.addButton}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or SKU"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.pillsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsContent}
        >
          {categories.map((cat) => {
            const active = cat === category;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
                style={[styles.pill, active && styles.pillActive]}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              {query ? `No products match "${query}"` : 'No products in this category'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

function ProductRow({ product, onPress }) {
  const stock = Number(product.stock);
  const stockBadge = getStockBadge(stock);
  const meta = CATEGORY_META[product.category] || CATEGORY_META.Default;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={22} color={meta.color} />
        </View>

        <View style={styles.rowLeft}>
          <Text style={styles.rowCategory}>{product.category}</Text>
          <Text style={styles.rowName} numberOfLines={1}>{product.name}</Text>
          {product.sku ? (
            <Text style={styles.rowSku}>SKU: {product.sku}</Text>
          ) : null}
        </View>

        <View style={styles.rowRight}>
          <Text style={styles.rowPrice}>${Number(product.price).toFixed(2)}</Text>
          <View style={[styles.stockPill, { backgroundColor: stockBadge.bg }]}>
            <Text style={[styles.stockPillText, { color: stockBadge.fg }]}>
              {stockBadge.label}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

function getStockBadge(stock) {
  if (stock <= 0) {
    return { label: 'OUT', bg: colors.dangerSoft, fg: colors.danger };
  }
  if (stock < 10) {
    return { label: `LOW · ${stock}`, bg: colors.warningSoft, fg: colors.warning };
  }
  return { label: `${stock} in stock`, bg: colors.surfaceAlt, fg: colors.textMuted };
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchWrap: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },

  pillsWrap: { paddingBottom: spacing.md },
  pillsContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },

  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLeft: { flex: 1, marginRight: spacing.md },
  rowCategory: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  rowName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  rowSku: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  rowRight: { alignItems: 'flex-end' },
  rowPrice: {
    ...typography.h4,
    color: colors.primary,
  },
  stockPill: {
    marginTop: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  stockPillText: {
    ...typography.tiny,
    fontWeight: '700',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },

  errorTitle: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retry: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radii.sm,
  },
  retryText: { ...typography.button, color: colors.textInverse },
});
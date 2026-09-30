import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Screen } from '../components/ui';
import ProductTile from '../components/ProductTile';
import CartBar from '../components/CartBar';
import { productsApi } from '../services/products';
import { useCart } from '../context/CartContext';
import { colors, spacing, typography, radii } from '../theme';

export default function SaleScreen({ navigation }) {
  const { addItem, itemCount, subtotal } = useCart();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await productsApi.list();
      setProducts(data.products);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load products', text2: err.message });
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

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const visible = category === 'All'
    ? products
    : products.filter((p) => p.category === category);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ProductTile product={item} onPress={addItem} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Register</Text>

            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(c) => c}
              contentContainerStyle={styles.chips}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setCategory(item)}
                  style={[styles.chip, category === item && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === item && styles.chipTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        }
      />

      <CartBar
        itemCount={itemCount}
        subtotal={subtotal}
        onPress={() => navigation.navigate('Cart')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: spacing.sm, paddingBottom: 100 },
  row: { paddingHorizontal: spacing.xs },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.lg },

  chips: { paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.captionMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
});
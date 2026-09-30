import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { ordersApi } from '../services/orders';
import { colors, spacing, typography, radii, shadows } from '../theme';
import { formatKES } from '../utils/currency';

const METHOD_META = {
  cash:  { icon: 'cash-outline',            color: '#059669', bg: '#ecfdf5', label: 'Cash' },
  mpesa: { icon: 'phone-portrait-outline',  color: '#0891b2', bg: '#ecfeff', label: 'M-Pesa' },
  card:  { icon: 'card-outline',            color: '#7c3aed', bg: '#f5f3ff', label: 'Card' },
  deni:  { icon: 'book-outline',            color: '#d97706', bg: '#fffbeb', label: 'Deni' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ count: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await ordersApi.list();
      setOrders(data.orders || []);
      setStats(data.stats || { count: 0, revenue: 0 });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load orders', text2: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
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

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Today's sales</Text>
          <Text style={styles.statValue}>{stats.count}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={[styles.statLabel, styles.statLabelPrimary]}>Revenue</Text>
          <Text style={[styles.statValue, styles.statValuePrimary]}>
            {formatKES(stats.revenue)}
          </Text>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No sales yet</Text>
            <Text style={styles.emptyHelp}>
              Completed sales will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderRow order={item} onPress={() => setSelected(item)} />
        )}
      />

      {/* DETAIL SHEET */}
      <OrderDetailSheet
        order={selected}
        onClose={() => setSelected(null)}
      />
    </SafeAreaView>
  );
}

function OrderRow({ order, onPress }) {
  const meta = METHOD_META[order.paymentMethod] || METHOD_META.cash;
  const time = new Date(order.createdAt).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const itemsCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.rowIcon, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={20} color={meta.color} />
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>
          {itemsCount} item{itemsCount === 1 ? '' : 's'} · {meta.label}
        </Text>
        <Text style={styles.rowMeta}>{time}</Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={styles.rowAmount}>{formatKES(order.total)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function OrderDetailSheet({ order, onClose }) {
  if (!order) return null;

  const meta = METHOD_META[order.paymentMethod] || METHOD_META.cash;
  const time = new Date(order.createdAt).toLocaleString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <ScrollView contentContainerStyle={styles.sheetBody}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon} size={24} color={meta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Sale #{order.id?.replace(/^o/, '').padStart(4, '0')}</Text>
              <Text style={styles.sheetMeta}>{time}</Text>
            </View>
          </View>

          <View style={styles.dashed} />

          {/* Items */}
          {order.items?.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemQty}>{item.quantity}×</Text>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemPrice}>
                {formatKES(Number(item.price) * item.quantity)}
              </Text>
            </View>
          ))}

          <View style={styles.dashed} />

          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatKES(order.subtotal)}</Text>
          </View>
          {order.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatKES(order.tax)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandRow]}>
            <Text style={styles.grandLabel}>TOTAL</Text>
            <Text style={styles.grandValue}>{formatKES(order.total)}</Text>
          </View>

          <View style={styles.dashed} />

          <View style={styles.payRow}>
            <Text style={styles.payLabel}>Paid via</Text>
            <Text style={styles.payValue}>{meta.label}</Text>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  statCardPrimary: {
    backgroundColor: colors.primary,
  },
  statLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  statLabelPrimary: {
    color: '#c7d2fe',
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statValuePrimary: {
    color: colors.textInverse,
  },

  // List
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.sm,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodyMedium, color: colors.text },
  rowMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowAmount: { ...typography.bodyBold, color: colors.text },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: spacing.huge,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h4, color: colors.text, marginTop: spacing.sm },
  emptyHelp: { ...typography.body, color: colors.textMuted },

  // Detail sheet
  backdrop: { flex: 1, backgroundColor: colors.overlayDark },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
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
  sheetBody: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sheetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { ...typography.h4, color: colors.text },
  sheetMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  dashed: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: spacing.md,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: spacing.sm,
  },
  itemQty: { ...typography.bodyBold, color: colors.primary, minWidth: 32 },
  itemName: { ...typography.body, color: colors.text, flex: 1 },
  itemPrice: {
    ...typography.bodyMedium,
    color: colors.text,
    minWidth: 80,
    textAlign: 'right',
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: { ...typography.body, color: colors.textSecondary },
  totalValue: { ...typography.bodyMedium, color: colors.text },
  grandRow: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  grandLabel: { ...typography.h4, color: colors.text },
  grandValue: { ...typography.h3, color: colors.primary },

  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  payLabel: { ...typography.caption, color: colors.textMuted },
  payValue: { ...typography.bodyMedium, color: colors.text },

  closeBtn: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  closeBtnText: { ...typography.button, color: colors.text },
});
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { ordersApi } from '../../services/orders';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii } from '../../theme';

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  mpesa: 'M-Pesa',
  mpesa_stk: 'STK',
};

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function buildSections(orders) {
  const groups = new Map();
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = dayKey(d);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  });

  return Array.from(groups.entries()).map(([title, data]) => {
    const total = data.reduce((s, o) => s + o.total, 0);
    const cash = data
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((s, o) => s + o.total, 0);
    const mpesa = data
      .filter((o) => o.paymentMethod !== 'cash')
      .reduce((s, o) => s + o.total, 0);
    return { title, data, total, cash, mpesa, count: data.length };
  });
}

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await ordersApi.list();
      setOrders(data.orders || []);
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

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => load(true));
    return unsub;
  }, [navigation, load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const sections = useMemo(() => buildSections(orders), [orders]);

  if (loading && orders.length === 0) {
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
        <Text style={styles.title}>Orders</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySub}>Completed sales will appear here</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionMeta}>
              {section.count} · {formatKsh(section.total)}
            </Text>
          </View>
        )}
        renderSectionFooter={({ section }) => (
          <View style={styles.sectionFooter}>
            <Text style={styles.footerText}>
              Cash {formatKsh(section.cash)}
            </Text>
            <Text style={styles.footerDot}>·</Text>
            <Text style={styles.footerText}>
              M-Pesa {formatKsh(section.mpesa)}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <OrderRow
            order={item}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          />
        )}
      />
    </SafeAreaView>
  );
}

function OrderRow({ order, onPress }) {
  const label = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;

  const time = new Date(order.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const failed = order.paymentStatus === 'failed';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.left}>
        <Text style={styles.time}>{time}</Text>
        <Text style={styles.meta}>
          {itemCount} item{itemCount === 1 ? '' : 's'} · {label}
          {failed ? ' · Failed' : ''}
        </Text>
      </View>

      <Text style={[styles.total, failed && styles.totalFailed]}>
        {formatKsh(order.total)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2, color: colors.text },

  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.textMuted,
  },

  sectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  footerText: {
    ...typography.tiny,
    color: colors.textMuted,
  },
  footerDot: {
    ...typography.tiny,
    color: colors.textMuted,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  left: { flex: 1, minWidth: 0 },
  time: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '500',
  },
  meta: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  total: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  totalFailed: { color: colors.danger, textDecorationLine: 'line-through' },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
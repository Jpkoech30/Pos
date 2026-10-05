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
import { colors, spacing, typography, radii, shadows } from '../../theme';

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

function isoDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildSections(orders) {
  const groups = new Map();
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = dayKey(d);
    if (!groups.has(key)) groups.set(key, { date: isoDate(d), data: [] });
    groups.get(key).data.push(o);
  });

  return Array.from(groups.entries()).map(([title, { date, data }]) => {
    const total = data.reduce((s, o) => s + o.total, 0);
    const cash = data
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((s, o) => s + o.total, 0);
    const mpesa = total - cash;
    return {
      title,
      date,
      data,
      total,
      cash,
      mpesa,
      count: data.length,
      cashRatio: total > 0 ? cash / total : 0,
    };
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
          <DayHeader
            section={section}
            onPress={() =>
              navigation.navigate('DailyAnalytics', {
                title: section.title,
                date: section.date,
                allOrders: orders,
              })
            }
          />
        )}
        renderSectionFooter={() => <View style={styles.cardEnd} />}
        renderItem={({ item, index, section }) => (
          <OrderRow
            order={item}
            isLast={index === section.data.length - 1}
            onPress={() => navigation.navigate('OrderDetail', { order: item })}
          />
        )}
      />
    </SafeAreaView>
  );
}

function DayHeader({ section, onPress }) {
  const { title, count, total, cash, mpesa, cashRatio } = section;
  const cashPct = Math.round(cashRatio * 100);

  return (
    <TouchableOpacity
      style={styles.dayCardTop}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dayRow}>
        <Text style={styles.dayLabel}>{title}</Text>
        <View style={styles.dayRight}>
          <Text style={styles.dayCount}>
            {count} {count === 1 ? 'order' : 'orders'}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </View>
      </View>

      <Text style={styles.dayTotal}>{formatKsh(total)}</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { flex: cashRatio }]} />
        <View style={[styles.barRest, { flex: 1 - cashRatio }]} />
      </View>

      <View style={styles.splitRow}>
        <View style={styles.splitItem}>
          <View style={[styles.splitDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.splitLabel}>Cash</Text>
          <Text style={styles.splitValue}>{formatKsh(cash)}</Text>
        </View>
        <View style={styles.splitItem}>
          <View style={[styles.splitDot, { backgroundColor: colors.mpesa }]} />
          <Text style={styles.splitLabel}>M-Pesa</Text>
          <Text style={styles.splitValue}>{formatKsh(mpesa)}</Text>
        </View>
      </View>

      {cash > 0 && mpesa > 0 && (
        <Text style={styles.splitHint}>
          {cashPct}% cash · {100 - cashPct}% M-Pesa
        </Text>
      )}
    </TouchableOpacity>
  );
}

function OrderRow({ order, isLast, onPress }) {
  const label = PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod;

  const time = new Date(order.createdAt).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const failed = order.paymentStatus === 'failed';

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.time}>{time}</Text>

      <Text style={styles.meta} numberOfLines={1}>
        {itemCount} item{itemCount === 1 ? '' : 's'} · {label}
        {failed ? ' · Failed' : ''}
      </Text>

      <Text style={[styles.total, failed && styles.totalFailed]}>
        {formatKsh(order.total)}
      </Text>

      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
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

  dayCardTop: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: spacing.lg,
  },
  cardEnd: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
    height: spacing.sm,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },

  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  dayRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayCount: {
    ...typography.caption,
    color: colors.textMuted,
  },

  dayTotal: {
    ...typography.h1,
    color: colors.text,
    fontSize: 32,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },

  barTrack: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  barFill: { backgroundColor: colors.primary },
  barRest: { backgroundColor: colors.mpesa },

  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  splitDot: { width: 8, height: 8, borderRadius: 4 },
  splitLabel: {
    ...typography.tiny,
    color: colors.textMuted,
  },
  splitValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  splitHint: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  rowLast: {},
  time: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '500',
    width: 48,
  },
  meta: {
    ...typography.tiny,
    color: colors.textMuted,
    flex: 1,
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
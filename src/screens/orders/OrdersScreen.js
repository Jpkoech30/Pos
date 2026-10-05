import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView,
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

const LOW_REVENUE_THRESHOLD = 0;

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
  const [view, setView] = useState('list');

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await ordersApi.list();
      setOrders(data.orders || []);
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
        <Text style={styles.headerTitle}>Orders</Text>
      </View>

      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, view === 'list' && styles.segmentBtnActive]}
          onPress={() => setView('list')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, view === 'list' && styles.segmentTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, view === 'analytics' && styles.segmentBtnActive]}
          onPress={() => setView('analytics')}
          activeOpacity={0.8}
        >
          <Text style={[styles.segmentText, view === 'analytics' && styles.segmentTextActive]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {view === 'list' ? (
        <OrdersList
          orders={orders}
          navigation={navigation}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : (
        <AnalyticsView
          orders={orders}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Orders list (existing)
// ─────────────────────────────────────────────
function OrdersList({ orders, navigation, refreshing, onRefresh }) {
  const sections = useMemo(() => buildSections(orders), [orders]);

  if (orders.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySub}>Completed sales will appear here</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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

// ─────────────────────────────────────────────
// Analytics view
// ─────────────────────────────────────────────
function AnalyticsView({ orders, refreshing, onRefresh }) {
  const [period, setPeriod] = useState('week'); // 'today' | 'week' | 'month'

  const stats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 6); // last 7 days
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const cutoff =
      period === 'today' ? startOfToday :
      period === 'week' ? startOfWeek :
      startOfMonth;

    const successful = orders.filter(
      (o) =>
        o.paymentStatus !== 'failed' &&
        new Date(o.createdAt) >= cutoff,
    );
    const failed = orders.filter(
      (o) =>
        o.paymentStatus === 'failed' &&
        new Date(o.createdAt) >= cutoff,
    );

    const revenue = successful.reduce((s, o) => s + o.total, 0);
    const cash = successful
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((s, o) => s + o.total, 0);
    const mpesa = revenue - cash;

    const cashOrders = successful.filter((o) => o.paymentMethod === 'cash').length;
    const mpesaOrders = successful.length - cashOrders;

    const grossProfit = successful.reduce((s, o) => {
      return s + (o.grossProfit != null ? o.grossProfit : 0);
    }, 0);
    const hasProfit = successful.some((o) => o.grossProfit != null);

    // Daily buckets for the chart (last 7 days, always)
    const buckets = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(startOfToday);
      day.setDate(day.getDate() - i);
      const total = orders
        .filter(
          (o) =>
            o.paymentStatus !== 'failed' &&
            sameDay(new Date(o.createdAt), day),
        )
        .reduce((s, o) => s + o.total, 0);
      buckets.push({
        date: day,
        label: day.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 2),
        value: total,
      });
    }
    const peakDaily = Math.max(0, ...buckets.map((b) => b.value));

    // Top items
    const itemMap = new Map();
    successful.forEach((o) => {
      o.items.forEach((i) => {
        const cur = itemMap.get(i.name) || { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.quantity;
        cur.revenue += i.price * i.quantity;
        itemMap.set(i.name, cur);
      });
    });
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      revenue,
      cash,
      mpesa,
      cashOrders,
      mpesaOrders,
      orderCount: successful.length,
      avg: successful.length > 0 ? revenue / successful.length : 0,
      grossProfit: hasProfit ? grossProfit : null,
      failedCount: failed.length,
      failedLoss: failed.reduce((s, o) => s + o.total, 0),
      buckets,
      peakDaily,
      topItems,
    };
  }, [orders, period]);

  const cashRatio = stats.revenue > 0 ? stats.cash / stats.revenue : 0;

  return (
    <ScrollView
      style={styles.analyticsScroll}
      contentContainerStyle={styles.analyticsContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Period selector */}
      <View style={styles.periodRow}>
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'Last 7 days' },
          { key: 'month', label: 'This month' },
        ].map((p) => {
          const active = period === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, active && styles.periodChipActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.periodText, active && styles.periodTextActive]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hero */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Revenue</Text>
        <Text style={styles.heroValue}>{formatKsh(stats.revenue)}</Text>
        <Text style={styles.heroSub}>
          {stats.orderCount} {stats.orderCount === 1 ? 'order' : 'orders'} ·
          {' '}avg {formatKsh(stats.avg)}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="cash-outline" size={16} color={colors.primary} />
          <Text style={styles.statBoxLabel}>Cash</Text>
          <Text style={styles.statBoxValue}>{formatKsh(stats.cash)}</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="phone-portrait-outline" size={16} color={colors.mpesa} />
          <Text style={styles.statBoxLabel}>M-Pesa</Text>
          <Text style={styles.statBoxValue}>{formatKsh(stats.mpesa)}</Text>
        </View>
      </View>

      {/* Split bar */}
      {stats.revenue > 0 && (
        <View style={styles.splitCard}>
          <View style={styles.splitBarTrack}>
            <View style={[styles.splitBarFill, { flex: cashRatio }]} />
            <View style={[styles.splitBarRest, { flex: 1 - cashRatio }]} />
          </View>
          <View style={styles.splitLabels}>
            <Text style={styles.splitLabelText}>
              {stats.cashOrders} cash
            </Text>
            <Text style={styles.splitLabelText}>
              {stats.mpesaOrders} M-Pesa
            </Text>
          </View>
        </View>
      )}

      {/* Profit */}
      {stats.grossProfit != null && (
        <View style={styles.profitCard}>
          <View style={styles.profitHeader}>
            <Text style={styles.profitLabel}>Gross profit</Text>
            {stats.revenue > 0 && (
              <Text style={styles.profitMargin}>
                {Math.round((stats.grossProfit / stats.revenue) * 100)}%
              </Text>
            )}
          </View>
          <Text style={styles.profitValue}>{formatKsh(stats.grossProfit)}</Text>
        </View>
      )}

      {/* Failed payments alert */}
      {stats.failedCount > 0 && (
        <View style={styles.alertCard}>
          <Ionicons name="warning-outline" size={18} color={colors.danger} />
          <View style={styles.alertBody}>
            <Text style={styles.alertTitle}>
              {stats.failedCount} failed{' '}
              {stats.failedCount === 1 ? 'payment' : 'payments'}
            </Text>
            <Text style={styles.alertSub}>
              {formatKsh(stats.failedLoss)} not collected
            </Text>
          </View>
        </View>
      )}

      {/* 7-day chart */}
      <Text style={styles.sectionLabel}>Last 7 days</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartRow}>
          {stats.buckets.map((b, idx) => {
            const ratio = stats.peakDaily > 0 ? b.value / stats.peakDaily : 0;
            return (
              <View key={idx} style={styles.chartCol}>
                <View style={styles.chartBarWrap}>
                  <View
                    style={[
                      styles.chartBar,
                      { height: `${Math.max(ratio * 100, 4)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{b.label}</Text>
              </View>
            );
          })}
        </View>
        {stats.peakDaily > 0 && (
          <Text style={styles.chartHint}>
            Peak day: {formatKsh(stats.peakDaily)}
          </Text>
        )}
      </View>

      {/* Top items */}
      <Text style={styles.sectionLabel}>Top items</Text>
      <View style={styles.card}>
        {stats.topItems.length === 0 ? (
          <Text style={styles.emptyChart}>No items sold in this period</Text>
        ) : (
          stats.topItems.map((item, idx) => (
            <View
              key={item.name}
              style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}
            >
              <Text style={[styles.itemRank, idx === 0 && styles.itemRankTop]}>
                {idx + 1}
              </Text>
              <View style={styles.itemMid}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemQty}>{item.qty} sold</Text>
              </View>
              <Text style={styles.itemRevenue}>
                {formatKsh(item.revenue)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={{ height: spacing.xxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: spacing.xxl,
  },

  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text },

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
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: { color: '#fff' },

  // ─── Orders list ───
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
    ...typography.overline,
    color: colors.textMuted,
    textTransform: 'uppercase',
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
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: { ...typography.body, color: colors.textSecondary },
  emptySub: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },

  // ─── Analytics ───
  analyticsScroll: { flex: 1 },
  analyticsContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
  },

  periodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  periodChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodTextActive: { color: '#fff' },

  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroLabel: {
    ...typography.overline,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  heroValue: {
    ...typography.priceLarge,
    color: '#fff',
    marginTop: spacing.xs,
  },
  heroSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 2,
    ...shadows.sm,
  },
  statBoxLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  statBoxValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },

  splitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  splitBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  splitBarFill: { backgroundColor: colors.primary },
  splitBarRest: { backgroundColor: colors.mpesa },
  splitLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitLabelText: {
    ...typography.tiny,
    color: colors.textMuted,
  },

  profitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  profitMargin: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '700',
  },
  profitValue: {
    ...typography.h2,
    color: colors.success,
    marginTop: spacing.xs,
  },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertBody: { flex: 1 },
  alertTitle: {
    ...typography.bodyMedium,
    color: colors.danger,
    fontWeight: '700',
  },
  alertSub: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 2,
  },

  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 6,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  chartHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  emptyChart: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  itemRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  itemRank: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    width: 20,
  },
  itemRankTop: { color: colors.primary },
  itemMid: { flex: 1, minWidth: 0 },
  itemName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  itemQty: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemRevenue: {
    ...typography.price,
    color: colors.text,
  },
});
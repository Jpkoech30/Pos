import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

function dateKey(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function prevDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function hourLabel(h) {
  return `${String(h).padStart(2, '0')}:00`;
}

export default function DailyAnalyticsScreen({ route, navigation }) {
  const { title = 'Day', date, allOrders = [] } = route.params || {};

  const { dayOrders, prevOrders } = useMemo(() => {
    if (!date) return { dayOrders: allOrders, prevOrders: [] };
    const prevIso = prevDate(date);
    const day = allOrders.filter((o) => dateKey(new Date(o.createdAt)) === date);
    const prev = allOrders.filter((o) => dateKey(new Date(o.createdAt)) === prevIso);
    return { dayOrders: day, prevOrders: prev };
  }, [date, allOrders]);

  const stats = useMemo(() => {
    const successful = dayOrders.filter((o) => o.paymentStatus !== 'failed');
    const failed = dayOrders.filter((o) => o.paymentStatus === 'failed');

    const total = successful.reduce((s, o) => s + o.total, 0);
    const cash = successful
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((s, o) => s + o.total, 0);
    const mpesa = total - cash;

    const cashOrders = successful.filter((o) => o.paymentMethod === 'cash').length;
    const mpesaOrders = successful.length - cashOrders;

    const count = successful.length;
    const avg = count > 0 ? total / count : 0;
    const failedLoss = failed.reduce((s, o) => s + o.total, 0);

    // Profit — only orders where every item had a cost snapshot
    const withProfit = successful.filter((o) => o.grossProfit != null);
    const withoutProfit = successful.length - withProfit.length;
    const hasAnyProfit = withProfit.length > 0;

    const grossProfit = hasAnyProfit
      ? +withProfit.reduce((s, o) => s + o.grossProfit, 0).toFixed(2)
      : null;
    const totalCost = hasAnyProfit
      ? +withProfit.reduce((s, o) => s + o.totalCost, 0).toFixed(2)
      : null;
    const revenueWithCost = hasAnyProfit
      ? +withProfit.reduce((s, o) => s + o.subtotal, 0).toFixed(2)
      : 0;
    const marginPct =
      hasAnyProfit && revenueWithCost > 0
        ? (grossProfit / revenueWithCost) * 100
        : null;

    // Items
    let itemsSold = 0;
    const itemMap = new Map();
    successful.forEach((o) => {
      o.items.forEach((i) => {
        itemsSold += i.quantity;
        const cur =
          itemMap.get(i.name) || {
            name: i.name,
            qty: 0,
            revenue: 0,
            profit: 0,
            hasCost: true,
          };
        cur.qty += i.quantity;
        cur.revenue += i.price * i.quantity;
        if (i.costPrice != null) {
          cur.profit += (i.price - i.costPrice) * i.quantity;
        } else {
          cur.hasCost = false;
        }
        itemMap.set(i.name, cur);
      });
    });
    const allItems = Array.from(itemMap.values()).map((it) => ({
      ...it,
      profit: +it.profit.toFixed(2),
      share: total > 0 ? it.revenue / total : 0,
    }));
    const topByRevenue = [...allItems]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const topByProfit = [...allItems]
      .filter((it) => it.hasCost)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // Hourly
    const buckets = Array(24).fill(0);
    successful.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      buckets[h] += o.total;
    });
    const firstHour = buckets.findIndex((v) => v > 0);
    const lastHour = 23 - [...buckets].reverse().findIndex((v) => v > 0);
    const hourly =
      firstHour === -1
        ? []
        : buckets.slice(firstHour, lastHour + 1).map((v, i) => ({
            hour: firstHour + i,
            value: v,
          }));
    const peakValue = Math.max(0, ...hourly.map((b) => b.value));
    const peakHour = hourly.find((b) => b.value === peakValue)?.hour;

    const prevTotal = prevOrders
      .filter((o) => o.paymentStatus !== 'failed')
      .reduce((s, o) => s + o.total, 0);

    return {
      total, cash, mpesa, count, avg, itemsSold,
      cashOrders, mpesaOrders,
      failedCount: failed.length, failedLoss,
      grossProfit, totalCost, marginPct, withoutProfit, hasAnyProfit,
      topByRevenue, topByProfit,
      hourly, peakValue, peakHour,
      prevTotal,
    };
  }, [dayOrders, prevOrders]);

  const cashRatio = stats.total > 0 ? stats.cash / stats.total : 0;

  const comparison = useMemo(() => {
    if (stats.prevTotal === 0 && stats.total === 0) return null;
    if (stats.prevTotal === 0 && stats.total > 0) {
      return { direction: 'up', label: 'First sale day' };
    }
    const delta = stats.total - stats.prevTotal;
    const pct = (delta / stats.prevTotal) * 100;
    if (Math.abs(pct) < 1) {
      return { direction: 'same', label: 'Same as yesterday' };
    }
    if (pct > 0) {
      return { direction: 'up', label: `↑ ${Math.round(pct)}% vs yesterday` };
    }
    return { direction: 'down', label: `↓ ${Math.abs(Math.round(pct))}% vs yesterday` };
  }, [stats.total, stats.prevTotal]);

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{title}</Text>
          <Text style={styles.heroTotal}>{formatKsh(stats.total)}</Text>

          {comparison && (
            <View
              style={[
                styles.deltaPill,
                comparison.direction === 'up' && styles.deltaPillUp,
                comparison.direction === 'down' && styles.deltaPillDown,
              ]}
            >
              <Text
                style={[
                  styles.deltaText,
                  comparison.direction === 'up' && styles.deltaTextUp,
                  comparison.direction === 'down' && styles.deltaTextDown,
                ]}
              >
                {comparison.label}
              </Text>
            </View>
          )}

          <Text style={styles.heroSub}>
            {stats.count} {stats.count === 1 ? 'order' : 'orders'} ·
            {' '}avg {formatKsh(stats.avg)} ·
            {' '}{stats.itemsSold} items
          </Text>
        </View>

        {/* Failed alert */}
        {stats.failedCount > 0 && (
          <View style={styles.alertCard}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <View style={styles.alertText}>
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

        {/* Profit card */}
        {stats.hasAnyProfit ? (
          <View style={styles.profitCard}>
            <View style={styles.profitHeader}>
              <Text style={styles.profitLabel}>Gross profit</Text>
              {stats.marginPct != null && (
                <View style={styles.marginChip}>
                  <Text style={styles.marginChipText}>
                    {Math.round(stats.marginPct)}% margin
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.profitValue}>
              {formatKsh(stats.grossProfit)}
            </Text>

            <View style={styles.profitBreakdown}>
              <View style={styles.profitItem}>
                <Text style={styles.profitItemLabel}>Revenue</Text>
                <Text style={styles.profitItemValue}>
                  {formatKsh(stats.total)}
                </Text>
              </View>
              <View style={styles.profitItemDivider} />
              <View style={styles.profitItem}>
                <Text style={styles.profitItemLabel}>Cost of goods</Text>
                <Text style={styles.profitItemValue}>
                  {formatKsh(stats.totalCost)}
                </Text>
              </View>
            </View>

            {stats.withoutProfit > 0 && (
              <View style={styles.profitWarning}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.profitWarningText}>
                  {stats.withoutProfit}{' '}
                  {stats.withoutProfit === 1
                    ? 'order has'
                    : 'orders have'}{' '}
                  no cost data and are excluded
                </Text>
              </View>
            )}
          </View>
        ) : (
          stats.count > 0 && (
            <View style={styles.noProfitCard}>
              <Ionicons name="help-circle-outline" size={20} color={colors.textMuted} />
              <View style={styles.noProfitText}>
                <Text style={styles.noProfitTitle}>No profit data</Text>
                <Text style={styles.noProfitSub}>
                  None of today's products have a cost price set. Add costs in
                  Products → Edit to start tracking profit.
                </Text>
              </View>
            </View>
          )
        )}

        {/* Split */}
        {stats.total > 0 && (
          <View style={styles.splitCard}>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { flex: cashRatio }]} />
              <View style={[styles.barRest, { flex: 1 - cashRatio }]} />
            </View>
            <View style={styles.splitRow}>
              <View style={styles.splitItem}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <View>
                  <Text style={styles.splitLabel}>
                    Cash · {stats.cashOrders}{' '}
                    {stats.cashOrders === 1 ? 'order' : 'orders'}
                  </Text>
                  <Text style={styles.splitValue}>{formatKsh(stats.cash)}</Text>
                </View>
              </View>
              <View style={styles.splitItem}>
                <View style={[styles.dot, { backgroundColor: colors.mpesaRed }]} />
                <View>
                  <Text style={styles.splitLabel}>
                    M-Pesa · {stats.mpesaOrders}{' '}
                    {stats.mpesaOrders === 1 ? 'order' : 'orders'}
                  </Text>
                  <Text style={styles.splitValue}>{formatKsh(stats.mpesa)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Hourly */}
        <Text style={styles.sectionLabel}>Sales by hour</Text>
        <View style={styles.card}>
          {stats.hourly.length === 0 ? (
            <Text style={styles.emptyChart}>No sales recorded</Text>
          ) : (
            <>
              <View style={styles.chartRow}>
                {stats.hourly.map((b) => {
                  const ratio = stats.peakValue > 0 ? b.value / stats.peakValue : 0;
                  const isPeak = b.hour === stats.peakHour;
                  return (
                    <View key={b.hour} style={styles.chartCol}>
                      <View style={styles.barWrap}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${Math.max(ratio * 100, 4)}%`,
                              backgroundColor: isPeak
                                ? colors.primary
                                : colors.primarySoft,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.hourText}>{hourLabel(b.hour)}</Text>
                    </View>
                  );
                })}
              </View>

              {stats.peakHour != null && (
                <View style={styles.peakRow}>
                  <Ionicons name="trending-up" size={14} color={colors.primary} />
                  <Text style={styles.peakText}>
                    Peak at {hourLabel(stats.peakHour)} ·{' '}
                    {formatKsh(stats.peakValue)}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Most profitable */}
        {stats.topByProfit.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Most profitable</Text>
            <View style={styles.card}>
              {stats.topByProfit.map((item, idx) => (
                <View
                  key={item.name}
                  style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}
                >
                  <Text style={[styles.itemRank, idx === 0 && styles.itemRankTop]}>
                    {idx + 1}
                  </Text>
                  <View style={styles.itemMid}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {idx === 0 && (
                        <View style={styles.bestBadge}>
                          <Text style={styles.bestBadgeText}>Top earner</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemQty}>
                      {item.qty} sold · {Math.round(item.share * 100)}% of revenue
                    </Text>
                  </View>
                  <Text style={styles.itemProfit}>
                    +{formatKsh(item.profit)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Top sellers */}
        <Text style={styles.sectionLabel}>Top sellers</Text>
        <View style={styles.card}>
          {stats.topByRevenue.length === 0 ? (
            <Text style={styles.emptyChart}>No items sold</Text>
          ) : (
            stats.topByRevenue.map((item, idx) => (
              <View
                key={item.name}
                style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}
              >
                <Text style={[styles.itemRank, idx === 0 && styles.itemRankTop]}>
                  {idx + 1}
                </Text>
                <View style={styles.itemMid}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {idx === 0 && (
                      <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>Best seller</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemQty}>
                    {item.qty} sold · {Math.round(item.share * 100)}% of revenue
                  </Text>
                </View>
                <Text style={styles.itemRevenue}>
                  {formatKsh(item.revenue)}
                </Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
          <Text style={styles.backText}>Back to all orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  heroTotal: {
    ...typography.h1,
    color: colors.text,
    fontSize: 40,
    marginTop: spacing.sm,
  },
  heroSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  deltaPill: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
  },
  deltaPillUp: { backgroundColor: colors.successSoft },
  deltaPillDown: { backgroundColor: colors.dangerSoft },
  deltaText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  deltaTextUp: { color: colors.success },
  deltaTextDown: { color: colors.danger },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertText: { flex: 1 },
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
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  marginChip: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  marginChipText: {
    ...typography.tiny,
    color: colors.success,
    fontWeight: '700',
  },
  profitValue: {
    ...typography.h1,
    color: colors.success,
    fontSize: 34,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  profitBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  profitItem: { flex: 1 },
  profitItemDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  profitItemLabel: {
    ...typography.tiny,
    color: colors.textMuted,
  },
  profitItemValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },
  profitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  profitWarningText: {
    ...typography.tiny,
    color: colors.textMuted,
    flex: 1,
  },

  noProfitCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  noProfitText: { flex: 1 },
  noProfitTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  noProfitSub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 18,
  },

  splitCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  barTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  barFill: { backgroundColor: colors.primary },
  barRest: { backgroundColor: colors.mpesaRed },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  splitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  splitLabel: { ...typography.tiny, color: colors.textMuted },
  splitValue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
    marginTop: 2,
  },

  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
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

  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  barWrap: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  hourText: {
    ...typography.tiny,
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 6,
  },

  peakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  peakText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
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
  itemRankTop: {
    color: colors.primary,
  },
  itemMid: { flex: 1, minWidth: 0 },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  bestBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  bestBadgeText: {
    ...typography.tiny,
    color: colors.success,
    fontWeight: '700',
  },
  itemQty: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemRevenue: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  itemProfit: {
    ...typography.bodyMedium,
    color: colors.success,
    fontWeight: '700',
  },

  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  backText: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
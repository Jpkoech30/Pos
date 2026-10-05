import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { shopApi } from '../../services/shop';
import { taxApi } from '../../services/tax';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

export default function TaxCenterScreen() {
  const { shop, refreshShop } = useAuth();

  const [vatRegistered, setVatRegistered] = useState(shop?.vatRegistered === true);
  const [pricesIncludeVat, setPricesIncludeVat] = useState(
    shop?.pricesIncludeVat !== false,
  );
  const [savingConfig, setSavingConfig] = useState(false);

  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      const data = await taxApi.summary();
      setSummary(data);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load summary',
        text2: err.message,
      });
    } finally {
      setLoadingSummary(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const onRefresh = () => {
    setRefreshing(true);
    loadSummary();
    refreshShop();
  };

  const saveConfig = async (next) => {
    setSavingConfig(true);
    try {
      await shopApi.setTaxConfig({
        vatRegistered: next.vatRegistered,
        vatRate: 16,
        pricesIncludeVat: next.pricesIncludeVat,
      });
      await refreshShop();
      await loadSummary();
      Toast.show({ type: 'success', text1: 'Tax settings saved' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: err.message });
    } finally {
      setSavingConfig(false);
    }
  };

  const toggleVatRegistered = (value) => {
    setVatRegistered(value);
    saveConfig({ vatRegistered: value, pricesIncludeVat });
  };

  const togglePricesIncludeVat = (value) => {
    setPricesIncludeVat(value);
    saveConfig({ vatRegistered, pricesIncludeVat: value });
  };

  if (loadingSummary) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isVat = summary?.vatRegistered === true;

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status hero */}
        <View style={[styles.hero, isVat ? styles.heroVat : styles.heroTot]}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={isVat ? 'receipt-outline' : 'cash-outline'}
              size={26}
              color="#fff"
            />
          </View>
          <View style={styles.heroBody}>
            <Text style={styles.heroLabel}>Your tax status</Text>
            <Text style={styles.heroTitle}>
              {isVat ? 'VAT Registered' : 'Turnover Tax (TOT)'}
            </Text>
            <Text style={styles.heroSub}>
              {isVat
                ? `You charge ${summary.vatRate}% VAT on taxable sales`
                : 'You pay 1.5% of gross sales — not added to customer bills'}
            </Text>
          </View>
        </View>

        {/* Period summary */}
        <Text style={styles.sectionLabel}>This month</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Gross sales</Text>
            <Text style={styles.statValue}>{formatKsh(summary.grossSales)}</Text>
          </View>
          <View style={styles.divider} />

          {isVat ? (
            <>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Taxable value</Text>
                <Text style={styles.statValue}>{formatKsh(summary.netSales)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, styles.statLabelStrong]}>
                  VAT collected
                </Text>
                <Text style={[styles.statValue, styles.statValueVat]}>
                  {formatKsh(summary.vatCollected)}
                </Text>
              </View>
              <Text style={styles.statHint}>
                Remit to KRA by the 20th of next month
              </Text>
            </>
          ) : (
            <>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, styles.statLabelStrong]}>
                  TOT liability
                </Text>
                <Text style={[styles.statValue, styles.statValueTot]}>
                  {formatKsh(summary.totLiability)}
                </Text>
              </View>
              <Text style={styles.statHint}>
                {summary.totRate}% of gross sales — set aside for KRA
              </Text>
            </>
          )}

          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Orders this month</Text>
            <Text style={styles.statValue}>{summary.orderCount}</Text>
          </View>
        </View>

        {/* Settings */}
        <Text style={styles.sectionLabel}>Settings</Text>
        <View style={styles.card}>
          <SettingRow
            title="VAT registered"
            subtitle="Turn on if your annual turnover is KES 5 million or more"
            value={vatRegistered}
            onValueChange={toggleVatRegistered}
            disabled={savingConfig}
          />

          {vatRegistered && (
            <>
              <View style={styles.divider} />
              <SettingRow
                title="Prices include VAT"
                subtitle="Recommended in Kenya — the shelf price is what the customer pays"
                value={pricesIncludeVat}
                onValueChange={togglePricesIncludeVat}
                disabled={savingConfig}
              />
              <Text style={styles.settingNote}>
                When on, VAT is backed out of the displayed price. Receipts show
                the VAT portion separately. When off, VAT is added at checkout.
              </Text>
            </>
          )}
        </View>

        {/* Guidance */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.info} />
          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>
              {isVat ? 'VAT filing reminder' : 'Turnover Tax basics'}
            </Text>
            <Text style={styles.infoText}>
              {isVat
                ? 'File your VAT return on iTax by the 20th of each month. Deduct input VAT on business purchases from the VAT you collected, then pay the difference.'
                : 'TOT applies to businesses with annual turnover between KES 1 million and KES 25 million. You pay 1.5% of gross monthly sales by the 20th of the following month. No expenses are deductible.'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.warning} />
          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>eTIMS required for all businesses</Text>
            <Text style={styles.infoText}>
              Every Kenyan business must issue tax invoices through KRA's eTIMS
              system — whether or not you're VAT-registered. Small businesses use
              eTIMS Lite via the *222# USSD code or the free eTIMS app.
            </Text>
          </View>
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ title, subtitle, value, onValueChange, disabled }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingBody}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSub}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroVat: { backgroundColor: colors.primary },
  heroTot: { backgroundColor: '#0e7490' },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: { flex: 1 },
  heroLabel: {
    ...typography.overline,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  heroTitle: {
    ...typography.h3,
    color: '#fff',
    marginTop: 2,
  },
  heroSub: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
  },

  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    ...shadows.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statLabel: { ...typography.body, color: colors.textSecondary },
  statLabelStrong: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  statValue: { ...typography.price, color: colors.text },
  statValueVat: { color: colors.primary },
  statValueTot: { color: '#0e7490' },
  statHint: {
    ...typography.tiny,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    marginTop: -spacing.xs,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  settingBody: { flex: 1 },
  settingTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  settingSub: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  settingNote: {
    ...typography.tiny,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    lineHeight: 16,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  infoBody: { flex: 1 },
  infoTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
});
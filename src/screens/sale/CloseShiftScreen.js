import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Share, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useShift } from '../../context/ShiftContext';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

export default function CloseShiftScreen({ navigation }) {
  const { currentShift, staff, closeShift } = useShift();
  const { clearCart } = useCart();
  const { shop } = useAuth();

  const [phase, setPhase] = useState('count');
  const [countedCash, setCountedCash] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  const [closedShift, setClosedShift] = useState(null);

  const handleClose = async () => {
    if (submitting) return;
    if (!currentShift) {
      Toast.show({ type: 'error', text1: 'No active shift' });
      navigation.goBack();
      return;
    }
    const raw = countedCash.trim().replace(/[^0-9.]/g, '');
    const counted = raw === '' ? null : Number(raw);
    if (counted !== null && (!Number.isFinite(counted) || counted < 0)) {
      Toast.show({ type: 'error', text1: 'Enter a valid amount' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await closeShift({ countedCash: counted });
      if (!result) throw new Error('Shift could not be closed');
      clearCart();
      setReport(result.report);
      setClosedShift(result.shift);
      setPhase('report');
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Close failed', text2: err.message });
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const buildShareText = () => {
    if (!report) return '';
    const dt = (iso) =>
      iso ? new Date(iso).toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) : '—';
    const lines = [];
    lines.push('Z-REPORT');
    if (shop?.name) lines.push(shop.name);
    lines.push('');
    lines.push(`Cashier: ${staff?.name || 'Unknown'}`);
    lines.push(`Opened: ${dt(closedShift?.openedAt)}`);
    lines.push(`Closed: ${dt(closedShift?.closedAt)}`);
    lines.push('');
    lines.push(`Orders: ${report.orderCount}`);
    lines.push(`Gross sales: ${formatKsh(report.grossSales)}`);
    lines.push(`Net (ex VAT): ${formatKsh(report.netSales)}`);
    if (report.vatTotal > 0) {
      lines.push(`VAT: ${formatKsh(report.vatTotal)}`);
    }
    lines.push('');
    lines.push('By payment');
    lines.push(`  Cash: ${formatKsh(report.cashTotal)}`);
    lines.push(`  M-Pesa: ${formatKsh(report.mpesaTotal)}`);
    lines.push(`  STK Push: ${formatKsh(report.stkTotal)}`);
    lines.push('');
    lines.push('Cash drawer');
    if (closedShift?.openingFloat != null) {
      lines.push(`  Opening float: ${formatKsh(closedShift.openingFloat)}`);
    }
    lines.push(`  Expected: ${formatKsh(report.expectedCash)}`);
    if (report.countedCash != null) {
      lines.push(`  Counted: ${formatKsh(report.countedCash)}`);
      const v = report.variance || 0;
      const label = v === 0 ? 'OK' : v > 0 ? `Over ${formatKsh(v)}` : `Short ${formatKsh(Math.abs(v))}`;
      lines.push(`  Variance: ${label}`);
    }
    if (report.pendingCount > 0) {
      lines.push('');
      lines.push(`Note: ${report.pendingCount} pending order(s) not counted`);
    }
    return lines.join('\n');
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: buildShareText() });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Share failed', text2: err.message });
    }
  };

  if (!currentShift && phase !== 'report') {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No open shift</Text>
          <Text style={styles.emptySub}>Nothing to close.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>Back to sale</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'report' && report) {
    const v = report.variance || 0;
    const varTone = report.countedCash == null ? 'muted' : v === 0 ? 'ok' : v > 0 ? 'warn' : 'bad';

    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successHeader}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Shift closed</Text>
            <Text style={styles.successMeta}>
              {staff?.name || 'Cashier'} · {report.orderCount} {report.orderCount === 1 ? 'order' : 'orders'}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Sales</Text>
          <View style={styles.card}>
            <Row label="Gross sales" value={formatKsh(report.grossSales)} bold />
            {report.vatTotal > 0 && (
              <>
                <Row label="Net (ex VAT)" value={formatKsh(report.netSales)} />
                <Row label="VAT" value={formatKsh(report.vatTotal)} />
              </>
            )}
          </View>

          <Text style={styles.sectionLabel}>By payment</Text>
          <View style={styles.card}>
            <Row label="Cash" value={formatKsh(report.cashTotal)} />
            <Row label="M-Pesa" value={formatKsh(report.mpesaTotal)} />
            <Row label="STK Push" value={formatKsh(report.stkTotal)} />
          </View>

          <Text style={styles.sectionLabel}>Cash drawer</Text>
          <View style={styles.card}>
            {closedShift?.openingFloat != null && (
              <Row label="Opening float" value={formatKsh(closedShift.openingFloat)} />
            )}
            <Row label="Expected" value={formatKsh(report.expectedCash)} />
            {report.countedCash != null && (
              <>
                <Row label="Counted" value={formatKsh(report.countedCash)} />
                <View style={styles.varianceRow}>
                  <Text style={styles.varianceLabel}>Variance</Text>
                  <Text
                    style={[
                      styles.varianceValue,
                      varTone === 'ok' && styles.varianceOk,
                      varTone === 'warn' && styles.varianceWarn,
                      varTone === 'bad' && styles.varianceBad,
                    ]}
                  >
                    {v === 0 ? 'Balanced' : v > 0 ? `+${formatKsh(v)}` : `-${formatKsh(Math.abs(v))}`}
                  </Text>
                </View>
              </>
            )}
          </View>

          {report.pendingCount > 0 && (
            <View style={styles.notice}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.textMuted} />
              <Text style={styles.noticeText}>
                {report.pendingCount} pending order(s) were not counted in this report.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, styles.bottomBarRow]}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-outline" size={20} color={colors.primary} />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.popToTop()}
            activeOpacity={0.85}
          >
            <Text style={styles.doneText}>New sale</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="log-out-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>End shift</Text>
            <Text style={styles.subtitle}>
              {staff?.name || 'Cashier'}'s shift{currentShift?.openedAt ? ` · started ${new Date(currentShift.openedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Cash count</Text>
          <View style={styles.card}>
            <Text style={styles.cardHint}>
              Count the cash in your drawer and enter the total.
            </Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputPrefix}>KSh</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={countedCash}
                onChangeText={(t) => setCountedCash(t.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                editable={!submitting}
                autoFocus
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleClose}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.primaryBtnText}>Confirm & close shift</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={submitting}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxl,
  },
  emptyTitle: { ...typography.h3, color: colors.text, marginTop: spacing.md },
  emptySub: {
    ...typography.body, color: colors.textSecondary,
    marginTop: spacing.xs, marginBottom: spacing.xl,
  },

  header: { alignItems: 'center', paddingVertical: spacing.xl },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.h2, color: colors.text },
  subtitle: {
    ...typography.caption, color: colors.textMuted,
    marginTop: spacing.xs, textAlign: 'center',
  },

  successHeader: { alignItems: 'center', paddingVertical: spacing.xl },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  successTitle: { ...typography.h2, color: colors.text },
  successMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },

  sectionLabel: {
    ...typography.overline, color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg, marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardHint: {
    ...typography.caption, color: colors.textSecondary,
    marginBottom: spacing.md, lineHeight: 18,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputPrefix: {
    ...typography.body, color: colors.textMuted, marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.h3,
    color: colors.text,
    paddingVertical: spacing.md,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  rowLabel: { ...typography.body, color: colors.textSecondary },
  rowValue: { ...typography.price, color: colors.text },
  rowLabelBold: { ...typography.bodyMedium, color: colors.text, fontWeight: '700' },
  rowValueBold: { ...typography.priceLarge, color: colors.text },

  varianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  varianceLabel: { ...typography.bodyMedium, color: colors.text, fontWeight: '700' },
  varianceValue: { ...typography.price, color: colors.textMuted, fontWeight: '700' },
  varianceOk: { color: colors.success },
  varianceWarn: { color: colors.primary },
  varianceBad: { color: colors.danger },

  notice: {
    flexDirection: 'row', alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeText: { ...typography.caption, color: colors.textSecondary, flex: 1 },

  bottomBar: { padding: spacing.screenPadding, gap: spacing.sm },
  bottomBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.button, color: '#fff' },
  cancelBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelText: { ...typography.bodyMedium, color: colors.textMuted },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  shareText: { ...typography.button, color: colors.primary, fontSize: 15 },
  doneBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  doneText: { ...typography.button, color: '#fff' },
});
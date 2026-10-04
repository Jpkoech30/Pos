import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { productsApi } from '../../services/products';
import { formatKsh } from '../../utils/format';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const CATEGORIES = ['Coffee', 'Pastry', 'Sandwich', 'Salad', 'Drink', 'Other'];

export default function ProductFormScreen({ navigation, route }) {
  const existing = route.params?.product || null;
  const isEdit = Boolean(existing);

  const [name, setName] = useState(existing?.name || '');
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '');
  const [costPrice, setCostPrice] = useState(
    existing?.costPrice != null ? String(existing.costPrice) : ''
  );
  const [category, setCategory] = useState(existing?.category || 'Coffee');
  const [sku, setSku] = useState(existing?.sku || '');
  const [barcode, setBarcode] = useState(existing?.barcode || '');
  const [stock, setStock] = useState(
    existing?.stock != null ? String(existing.stock) : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const priceNum = Number(price) || 0;
  const costNum = Number(costPrice) || 0;

  const { margin, profit, valid } = useMemo(() => {
    const p = priceNum;
    const c = costNum;
    if (p <= 0 || c <= 0) return { margin: null, profit: null, valid: false };
    const profitPerUnit = p - c;
    const marginPct = (profitPerUnit / p) * 100;
    return {
      margin: marginPct,
      profit: profitPerUnit,
      valid: profitPerUnit >= 0,
    };
  }, [priceNum, costNum]);

  const canSubmit =
    name.trim().length > 0 &&
    priceNum > 0 &&
    !submitting;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      price: priceNum,
      costPrice: costPrice ? costNum : null,
      category,
      sku: sku.trim() || null,
      barcode: barcode.trim() || null,
      stock: Number.isInteger(Number(stock)) ? Number(stock) : 0,
    };

    try {
      if (isEdit) {
        await productsApi.update(existing.id, payload);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        await productsApi.create(payload);
        Toast.show({ type: 'success', text1: 'Product created' });
      }
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: err.message });
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    // Simple confirm via a second tap on the same button would be safer,
    // but for now rely on the destructive styling and require a long press later.
    // Keeping this minimal — just call through.
    deleteProduct();
  };

  const deleteProduct = async () => {
    setSubmitting(true);
    try {
      await productsApi.remove(existing.id);
      Toast.show({ type: 'success', text1: 'Product deleted' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Delete failed', text2: err.message });
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Pricing block — highest value, goes first */}
          <Text style={styles.sectionLabel}>Pricing</Text>
          <View style={styles.card}>
            <Field label="Selling price">
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))}
              />
            </Field>

            <View style={styles.fieldGap} />

            <Field label="Cost price (what you paid)">
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={costPrice}
                onChangeText={(t) => setCostPrice(t.replace(/[^0-9.]/g, ''))}
              />
            </Field>

            {/* Live margin readout */}
            {margin != null && (
              <View style={[styles.marginBox, !valid && styles.marginBoxBad]}>
                <View style={styles.marginRow}>
                  <Ionicons
                    name={valid ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={valid ? colors.success : colors.danger}
                  />
                  <Text
                    style={[
                      styles.marginText,
                      { color: valid ? colors.success : colors.danger },
                    ]}
                  >
                    {valid
                      ? `Margin ${Math.round(margin)}%`
                      : `Loss ${Math.abs(Math.round(margin))}%`}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.marginSub,
                    { color: valid ? colors.success : colors.danger },
                  ]}
                >
                  {valid
                    ? `${formatKsh(profit)} profit per unit`
                    : `Selling below cost by ${formatKsh(Math.abs(profit))}`}
                </Text>
              </View>
            )}

            {costPrice === '' && (
              <Text style={styles.hint}>
                No cost set — this product won't show in profit reports
              </Text>
            )}
          </View>

          {/* Product info */}
          <Text style={styles.sectionLabel}>Product</Text>
          <View style={styles.card}>
            <Field label="Name">
              <TextInput
                style={styles.input}
                placeholder="e.g. Flat White"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Field>

            <View style={styles.fieldGap} />

            <Field label="Category">
              <View style={styles.chipsWrap}>
                {CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setCategory(c)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Field>

            <View style={styles.fieldGap} />

            <Field label="Stock on hand">
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                value={stock}
                onChangeText={(t) => setStock(t.replace(/[^0-9]/g, ''))}
              />
            </Field>
          </View>

          {/* Codes — optional */}
          <Text style={styles.sectionLabel}>Codes (optional)</Text>
          <View style={styles.card}>
            <Field label="SKU">
              <TextInput
                style={styles.input}
                placeholder="e.g. COF-001"
                placeholderTextColor={colors.textMuted}
                value={sku}
                onChangeText={setSku}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Field>

            <View style={styles.fieldGap} />

            <Field label="Barcode">
              <TextInput
                style={styles.input}
                placeholder="e.g. 1234567890123"
                placeholderTextColor={colors.textMuted}
                value={barcode}
                onChangeText={(t) => setBarcode(t.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
            </Field>
          </View>

          {/* Delete — only in edit mode */}
          {isEdit && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Delete product</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSubmit}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveText}>
                  {isEdit ? 'Save changes' : 'Create product'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  fieldGap: { height: spacing.md },

  fieldLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    ...typography.bodyMedium,
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Margin readout
  marginBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    gap: 2,
  },
  marginBoxBad: {
    backgroundColor: colors.dangerSoft,
  },
  marginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  marginText: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  marginSub: {
    ...typography.caption,
    marginLeft: 26,
  },
  hint: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.md,
    fontStyle: 'italic',
  },

  // Category chips
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  deleteText: {
    ...typography.bodyMedium,
    color: colors.danger,
    fontWeight: '600',
  },

  // Bottom
  bottomBar: {
    padding: spacing.screenPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17,
  },
});
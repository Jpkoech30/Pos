import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { productsApi } from '../../services/products';
import { catalogApi } from '../../services/catalog';
import { useCart } from '../../context/CartContext';
import { formatKsh } from '../../utils/format';
import { isValidGtin, gtinSymbology, cleanGtin } from '../../utils/gtin';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const CATEGORIES = ['Grocery', 'Drinks', 'Snacks', 'Personal care', 'Household', 'Other'];

// Plain-language margin feedback.
function marginLabel(pct) {
  if (pct < 0) return { text: 'Loss — selling below cost', tone: 'danger' };
  if (pct < 5) return { text: 'Very thin margin', tone: 'warn' };
  if (pct < 15) return { text: 'Thin margin', tone: 'warn' };
  if (pct < 30) return { text: 'Healthy margin', tone: 'ok' };
  return { text: 'Great margin', tone: 'ok' };
}

export default function ProductFormScreen({ navigation, route }) {
  const existing = route.params?.product || null;
  const isEdit = Boolean(existing);
  const returnToSale = route.params?.returnToSale === true;

  const { addToCart } = useCart();

  const [name, setName] = useState(existing?.name || '');
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '');
  const [costPrice, setCostPrice] = useState(
    existing?.costPrice != null ? String(existing.costPrice) : ''
  );
  const [category, setCategory] = useState(existing?.category || 'Grocery');
  const [sku, setSku] = useState(existing?.sku || '');
  const [barcode, setBarcode] = useState(existing?.barcode || '');
  const [stock, setStock] = useState(
    existing?.stock != null ? String(existing.stock) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Handle a scanned barcode arriving via route params
  useEffect(() => {
    const scanned = route.params?.scannedBarcode;
    if (!scanned) return;
    setBarcode(cleanGtin(scanned));
    setShowAdvanced(true);
    Toast.show({ type: 'success', text1: 'Barcode scanned', text2: scanned });
    navigation.setParams({ scannedBarcode: undefined, scanTs: undefined });
  }, [route.params?.scanTs, route.params?.scannedBarcode, navigation]);

  const priceNum = Number(price) || 0;
  const costNum = Number(costPrice) || 0;

  const { margin, profit, valid: marginValid } = useMemo(() => {
    const p = priceNum;
    const c = costNum;
    if (p <= 0 || c <= 0) return { margin: null, profit: null, valid: false };
    const profitPerUnit = p - c;
    const marginPct = (profitPerUnit / p) * 100;
    return { margin: marginPct, profit: profitPerUnit, valid: profitPerUnit >= 0 };
  }, [priceNum, costNum]);

  const marginInfo = margin != null ? marginLabel(margin) : null;

  const barcodeStatus = useMemo(() => {
    const digits = cleanGtin(barcode);
    if (digits.length === 0) return { state: 'empty', text: 'Optional — helps with scanning' };
    if (digits.length < 4) return { state: 'warn', text: 'Too short' };
    if ([8, 12, 13, 14].includes(digits.length)) {
      if (isValidGtin(digits)) {
        const sym = gtinSymbology(digits);
        return { state: 'ok', text: `${sym} ✓ Valid` };
      }
      return { state: 'error', text: 'Check digit invalid — might be a typo' };
    }
    return { state: 'warn', text: `${digits.length} digits` };
  }, [barcode]);

  const canSubmit =
    name.trim().length > 0 &&
    priceNum > 0 &&
    barcodeStatus.state !== 'error' &&
    !submitting;

  const handleScanBarcode = () => {
    navigation.navigate('Scanner');
  };

  const handleNameChange = (text) => {
    setName(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (text.trim().length < 2 || isEdit) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await catalogApi.search(text.trim());
        const results = data.results || [];
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250);
  };

  const applySuggestion = (item) => {
    setName(item.name);
    setCategory(item.category || 'Other');
    if (item.suggestedPrice != null) setPrice(String(item.suggestedPrice));
    if (item.suggestedCost != null) setCostPrice(String(item.suggestedCost));
    if (item.typicalBarcode && !barcode) setBarcode(item.typicalBarcode);
    setShowSuggestions(false);
    setSuggestions([]);
    Toast.show({
      type: 'success',
      text1: 'Filled from catalog',
      text2: 'Adjust as needed',
    });
  };

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      price: priceNum,
      costPrice: costPrice ? costNum : null,
      category,
      sku: sku.trim() || null,
      barcode: barcode ? cleanGtin(barcode) : null,
      stock: Number.isInteger(Number(stock)) ? Number(stock) : 0,
    };

    try {
      if (isEdit) {
        await productsApi.update(existing.id, payload);
        Toast.show({ type: 'success', text1: 'Product updated' });
        navigation.goBack();
      } else {
        const data = await productsApi.create(payload);
        if (returnToSale && data?.product) {
          addToCart(data.product);
          Toast.show({
            type: 'success',
            text1: 'Added to sale',
            text2: data.product.name,
          });
          navigation.popToTop();
        } else {
          Toast.show({ type: 'success', text1: 'Product created' });
          navigation.goBack();
        }
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: err.message });
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
          {/* ─── Step 1: What are you selling? ─── */}
          <StepHeader n={1} title="What are you selling?" />
          <View style={styles.card}>
            <View>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Start typing — e.g. Coca-Cola 500ml"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={handleNameChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoCapitalize="words"
              />

              {showSuggestions && suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  <View style={styles.suggestionsHeader}>
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                    <Text style={styles.suggestionsHeaderText}>
                      From the catalog — tap to auto-fill
                    </Text>
                  </View>
                  {suggestions.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.suggestion,
                        idx === suggestions.length - 1 && styles.suggestionLast,
                      ]}
                      onPress={() => applySuggestion(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.suggestionBody}>
                        <Text style={styles.suggestionName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.suggestionMeta} numberOfLines={1}>
                          {item.brand ? `${item.brand} · ` : ''}
                          {item.category}
                          {item.unit ? ` · ${item.unit}` : ''}
                          {item.suggestedPrice
                            ? ` · ~${formatKsh(item.suggestedPrice)}`
                            : ''}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!isEdit && name.length < 2 && (
                <Text style={styles.helperText}>
                  We have 200+ Kenyan products — try "Fresh Fri", "Omo", "Brookside"
                </Text>
              )}
            </View>

            <View style={styles.gap} />

            <View>
              <Text style={styles.fieldLabel}>Category</Text>
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
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ─── Step 2: Set your prices ─── */}
          <StepHeader n={2} title="Set your prices" />
          <View style={styles.card}>
            <View>
              <Text style={styles.fieldLabel}>Selling price</Text>
              <Text style={styles.fieldHint}>What the customer pays</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={price}
                onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ''))}
              />
            </View>

            <View style={styles.gap} />

            <View>
              <Text style={styles.fieldLabel}>Cost price</Text>
              <Text style={styles.fieldHint}>
                What you paid the supplier — leave blank if unknown
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={costPrice}
                onChangeText={(t) => setCostPrice(t.replace(/[^0-9.]/g, ''))}
              />
            </View>

            {margin != null && marginInfo && (
              <View
                style={[
                  styles.marginBox,
                  marginInfo.tone === 'warn' && styles.marginBoxWarn,
                  marginInfo.tone === 'danger' && styles.marginBoxDanger,
                ]}
              >
                <View style={styles.marginRow}>
                  <Ionicons
                    name={
                      marginInfo.tone === 'ok'
                        ? 'trending-up'
                        : marginInfo.tone === 'warn'
                        ? 'alert-circle'
                        : 'trending-down'
                    }
                    size={18}
                    color={
                      marginInfo.tone === 'ok'
                        ? colors.success
                        : marginInfo.tone === 'warn'
                        ? colors.warning
                        : colors.danger
                    }
                  />
                  <Text
                    style={[
                      styles.marginText,
                      {
                        color:
                          marginInfo.tone === 'ok'
                            ? colors.success
                            : marginInfo.tone === 'warn'
                            ? colors.warning
                            : colors.danger,
                      },
                    ]}
                  >
                    {marginInfo.text} · {Math.round(Math.abs(margin))}%
                  </Text>
                </View>
                <Text
                  style={[
                    styles.marginSub,
                    {
                      color:
                        marginInfo.tone === 'ok'
                          ? colors.success
                          : marginInfo.tone === 'warn'
                          ? colors.warning
                          : colors.danger,
                    },
                  ]}
                >
                  {marginValid
                    ? `You make ${formatKsh(profit)} on each one`
                    : `You lose ${formatKsh(Math.abs(profit))} on each one`}
                </Text>
              </View>
            )}

            {costPrice === '' && priceNum > 0 && (
              <View style={styles.infoBox}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <Text style={styles.infoText}>
                  Add a cost price so this product appears in your profit reports
                </Text>
              </View>
            )}
          </View>

          {/* ─── Step 3: Stock ─── */}
          <StepHeader n={3} title="How many do you have?" optional />
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={stock}
              onChangeText={(t) => setStock(t.replace(/[^0-9]/g, ''))}
            />
            <Text style={styles.helperText}>
              You can update this later — start at 0 if unsure
            </Text>
          </View>

          {/* ─── Advanced ─── */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showAdvanced ? 'chevron-down' : 'chevron-forward'}
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.advancedToggleText}>
              Advanced {barcode || sku ? '(set)' : '(optional)'}
            </Text>
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.card}>
              <View>
                <Text style={styles.fieldLabel}>Barcode (GTIN)</Text>
                <Text style={styles.fieldHint}>
                  Scan the package — skip if the item has no barcode
                </Text>
                <View style={styles.barcodeRow}>
                  <TextInput
                    style={[styles.input, styles.barcodeInput]}
                    placeholder="Scan or type"
                    placeholderTextColor={colors.textMuted}
                    value={barcode}
                    onChangeText={(t) => setBarcode(cleanGtin(t))}
                    keyboardType="number-pad"
                    maxLength={14}
                  />
                  <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={handleScanBarcode}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="barcode-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.barcodeStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      barcodeStatus.state === 'ok' && { backgroundColor: colors.success },
                      barcodeStatus.state === 'warn' && { backgroundColor: colors.warning },
                      barcodeStatus.state === 'error' && { backgroundColor: colors.danger },
                      barcodeStatus.state === 'empty' && { backgroundColor: colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      barcodeStatus.state === 'ok' && { color: colors.success },
                      barcodeStatus.state === 'warn' && { color: colors.warning },
                      barcodeStatus.state === 'error' && { color: colors.danger },
                    ]}
                  >
                    {barcodeStatus.text}
                  </Text>
                </View>
              </View>

              <View style={styles.gap} />

              <View>
                <Text style={styles.fieldLabel}>SKU</Text>
                <Text style={styles.fieldHint}>
                  Internal code — optional, useful for stock takes
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. COF-001"
                  placeholderTextColor={colors.textMuted}
                  value={sku}
                  onChangeText={setSku}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>

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
                  {isEdit ? 'Save changes' : 'Add to my products'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepHeader({ n, title, optional }) {
  return (
    <View style={styles.stepHeader}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{n}</Text>
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      {optional && <Text style={styles.stepOptional}>Optional</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },

  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: {
    ...typography.tiny,
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },
  stepTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
  },
  stepOptional: {
    ...typography.tiny,
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  gap: { height: spacing.lg },

  fieldLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  fieldHint: {
    ...typography.tiny,
    color: colors.textMuted,
    marginBottom: spacing.xs,
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
  helperText: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  suggestions: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    overflow: 'hidden',
    ...shadows.sm,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
  },
  suggestionsHeaderText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  suggestionLast: { borderBottomWidth: 0 },
  suggestionBody: { flex: 1, minWidth: 0 },
  suggestionName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  suggestionMeta: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },

  marginBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radii.md,
    gap: 2,
  },
  marginBoxWarn: { backgroundColor: colors.warningSoft },
  marginBoxDanger: { backgroundColor: colors.dangerSoft },
  marginRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  marginText: { ...typography.bodyMedium, fontWeight: '700' },
  marginSub: { ...typography.caption, marginLeft: 26 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
  },
  infoText: {
    ...typography.tiny,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  advancedToggleText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },

  barcodeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  barcodeInput: { flex: 1 },
  scanBtn: {
    width: 52, height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.sm,
  },
  barcodeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    ...typography.tiny,
    color: colors.textMuted,
    fontWeight: '600',
  },

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
  saveText: { ...typography.button, color: '#fff', fontSize: 17 },
});
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, typography, radii } from '../theme';

const STOCK_OPTIONS = [
  { key: 'all', label: 'Any' },
  { key: 'in', label: 'In stock' },
  { key: 'low', label: 'Low stock' },
  { key: 'out', label: 'Out of stock' },
];

const MARGIN_OPTIONS = [
  { key: 'all', label: 'Any' },
  { key: 'under10', label: 'Under 10%' },
  { key: '10to30', label: '10–30%' },
  { key: 'over30', label: 'Over 30%' },
  { key: 'nocost', label: 'No cost set' },
];

const SORT_OPTIONS = [
  { key: 'name', label: 'Name A–Z' },
  { key: 'recent', label: 'Recently added' },
  { key: 'priceHigh', label: 'Price: high → low' },
  { key: 'priceLow', label: 'Price: low → high' },
  { key: 'stockLow', label: 'Stock: low first' },
];

export default function FilterSheet({
  visible,
  categories,
  filters,
  sort,
  onApply,
  onClose,
}) {
  const [local, setLocal] = useState(filters);
  const [localSort, setLocalSort] = useState(sort);

  useEffect(() => {
    if (visible) {
      setLocal(filters);
      setLocalSort(sort);
    }
  }, [visible, filters, sort]);

  const toggleCategory = (c) => {
    const cur = local.category || [];
    const next = cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c];
    setLocal({ ...local, category: next.length ? next : null });
  };

  const reset = () => {
    setLocal({ category: null, stock: 'all', margin: 'all' });
    setLocalSort('name');
  };

  const apply = () => {
    onApply(local, localSort);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter & sort</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Sort by</Text>
            <View style={styles.chipsWrap}>
              {SORT_OPTIONS.map((o) => {
                const active = localSort === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setLocalSort(o.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Stock status</Text>
            <View style={styles.chipsWrap}>
              {STOCK_OPTIONS.map((o) => {
                const active = (local.stock || 'all') === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setLocal({ ...local, stock: o.key })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Margin</Text>
            <View style={styles.chipsWrap}>
              {MARGIN_OPTIONS.map((o) => {
                const active = (local.margin || 'all') === o.key;
                return (
                  <TouchableOpacity
                    key={o.key}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setLocal({ ...local, margin: o.key })}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {categories.length > 1 && (
              <>
                <Text style={styles.sectionLabel}>Categories</Text>
                <View style={styles.chipsWrap}>
                  {categories
                    .filter((c) => c !== 'All')
                    .map((c) => {
                      const active = (local.category || []).includes(c);
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => toggleCategory(c)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </>
            )}

            <View style={{ height: spacing.xxxl }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={reset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={apply}
              activeOpacity={0.85}
            >
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  scroll: { flexGrow: 0 },
  scrollContent: { padding: spacing.lg },

  sectionLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
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
  chipTextActive: { color: '#fff' },

  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resetBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    ...typography.button,
    color: '#fff',
  },
});
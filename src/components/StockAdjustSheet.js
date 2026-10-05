import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { colors, spacing, typography, radii, shadows } from '../theme';

const QUICK_DELTAS = [1, 5, 10, 24];

export default function StockAdjustSheet({ visible, product, onClose, onSave }) {
  const [custom, setCustom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCustom('');
      setSubmitting(false);
    }
  }, [visible, product?.id]);

  if (!product) return null;

  const current = Number(product.stock) || 0;

  const save = async (nextStock) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSave(product, nextStock);
      onClose();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.message });
      setSubmitting(false);
    }
  };

  const applyDelta = (delta) => save(current + delta);
  const applyExact = () => {
    const n = Number(custom);
    if (!Number.isFinite(n) || n < 0) return;
    save(Math.floor(n));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerBody}>
                <Text style={styles.headerLabel}>Adjust stock</Text>
                <Text style={styles.headerName} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.headerCurrent}>
                  Currently {current} in stock
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Add to stock</Text>
            <View style={styles.deltaRow}>
              {QUICK_DELTAS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.deltaBtn}
                  onPress={() => applyDelta(d)}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deltaText}>+{d}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Or set exact count</Text>
            <View style={styles.exactRow}>
              <TextInput
                style={styles.exactInput}
                keyboardType="number-pad"
                placeholder={String(current)}
                placeholderTextColor={colors.textMuted}
                value={custom}
                onChangeText={(t) => setCustom(t.replace(/[^0-9]/g, ''))}
              />
              <TouchableOpacity
                style={[
                  styles.exactBtn,
                  (!custom || submitting) && styles.exactBtnDisabled,
                ]}
                onPress={applyExact}
                disabled={!custom || submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.exactBtnText}>Set</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => save(0)}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.resetText}>Mark as out of stock</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  headerBody: { flex: 1 },
  headerLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerName: {
    ...typography.h3,
    color: colors.text,
  },
  headerCurrent: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  sectionLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  deltaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deltaBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
  },
  deltaText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },

  exactRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  exactInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exactBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  exactBtnDisabled: { opacity: 0.4 },
  exactBtnText: {
    ...typography.button,
    color: '#fff',
  },

  resetBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
});
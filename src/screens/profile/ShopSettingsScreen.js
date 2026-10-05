import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { shopApi } from '../../services/shop';
import { colors, spacing, typography, radii } from '../../theme';

export default function ShopSettingsScreen({ navigation }) {
  const { shop, refreshShop } = useAuth();

  const [name, setName] = useState(shop?.name || '');
  const [address, setAddress] = useState(shop?.address || '');
  const [mpesaNumber, setMpesaNumber] = useState(shop?.mpesaNumber || '');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    !submitting &&
    (name !== shop?.name ||
      address !== (shop?.address || '') ||
      mpesaNumber !== (shop?.mpesaNumber || ''));

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await shopApi.update({
        name: name.trim(),
        address: address.trim() || null,
        mpesaNumber: mpesaNumber.trim() || null,
      });
      await refreshShop();
      Toast.show({ type: 'success', text1: 'Shop updated' });
      navigation.goBack();
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Identity</Text>
          <View style={styles.card}>
            <Field label="Shop name">
              <TextInput
                style={styles.input}
                placeholder="e.g. Mama Jane's Kiosk"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Field>

            <View style={styles.gap} />

            <Field label="Address (optional)">
              <TextInput
                style={styles.input}
                placeholder="e.g. Ngong Road, Nairobi"
                placeholderTextColor={colors.textMuted}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </Field>
          </View>

          <Text style={styles.sectionLabel}>M-Pesa (Pochi la Biashara)</Text>
          <View style={styles.card}>
            <Field label="Pochi number">
              <TextInput
                style={styles.input}
                placeholder="0712 345 678"
                placeholderTextColor={colors.textMuted}
                value={mpesaNumber}
                onChangeText={setMpesaNumber}
                keyboardType="phone-pad"
              />
            </Field>
            <Text style={styles.hint}>
              Customers send payment to this number. The cashier confirms
              receipt on the checkout screen.
            </Text>
          </View>

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
              <Text style={styles.saveText}>Save changes</Text>
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
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  gap: { height: spacing.md },

  fieldLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    fontWeight: '600',
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
  hint: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 16,
  },

  bottomBar: {
    padding: spacing.screenPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  saveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
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
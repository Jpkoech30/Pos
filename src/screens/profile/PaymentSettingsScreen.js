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
import { colors, spacing, typography, radii, shadows } from '../../theme';

export default function PaymentSettingsScreen({ navigation }) {
  const { shop, refreshShop } = useAuth();

  const alreadyConfigured =
    shop?.stkEnabled === true && shop?.hasCredentials === true;

  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [passkey, setPasskey] = useState('');
  const [shortcode, setShortcode] = useState(shop?.darajaShortcode || '');
  const [env, setEnv] = useState(shop?.darajaEnv || 'sandbox');
  const [submitting, setSubmitting] = useState(false);
  const [testing, setTesting] = useState(false);

  const typed = {
    consumerKey: consumerKey.trim(),
    consumerSecret: consumerSecret.trim(),
    passkey: passkey.trim(),
    shortcode: shortcode.trim(),
  };
  const allTyped = typed.consumerKey && typed.consumerSecret &&
                   typed.passkey && typed.shortcode;

  const canSave = alreadyConfigured
    ? (typed.consumerKey || typed.consumerSecret || typed.passkey ||
       typed.shortcode !== (shop?.darajaShortcode || '') ||
       env !== (shop?.darajaEnv || 'sandbox'))
    : allTyped;

  const canTest = alreadyConfigured ? true : allTyped;

  const handleTest = async () => {
    if (!canTest) return;
    setTesting(true);
    try {
      await shopApi.testDaraja({
        consumerKey: typed.consumerKey || undefined,
        consumerSecret: typed.consumerSecret || undefined,
        passkey: typed.passkey || undefined,
        shortcode: typed.shortcode || undefined,
        env,
      });
      Toast.show({
        type: 'success',
        text1: 'Credentials valid',
        text2: 'Safaricom accepted the connection',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Test failed',
        text2: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      await shopApi.setDaraja({
        consumerKey: typed.consumerKey || undefined,
        consumerSecret: typed.consumerSecret || undefined,
        passkey: typed.passkey || undefined,
        shortcode: typed.shortcode || undefined,
        env,
      });
      await refreshShop();
      Toast.show({
        type: 'success',
        text1: alreadyConfigured ? 'STK Push updated' : 'STK Push enabled',
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Save failed', text2: err.message });
      setSubmitting(false);
    }
  };

  const handleClear = async () => {
    setSubmitting(true);
    try {
      await shopApi.clearDaraja();
      await refreshShop();
      Toast.show({ type: 'info', text1: 'STK Push disabled' });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
      setSubmitting(false);
    }
  };

  const secretPlaceholder = alreadyConfigured
    ? '•••••••• (leave blank to keep)'
    : 'From Daraja portal';

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
          <View
            style={[
              styles.statusCard,
              alreadyConfigured ? styles.statusCardOk : styles.statusCardOff,
            ]}
          >
            <Ionicons
              name={alreadyConfigured ? 'checkmark-circle' : 'flash-off-outline'}
              size={20}
              color={alreadyConfigured ? colors.success : colors.textMuted}
            />
            <View style={styles.statusText}>
              <Text style={styles.statusTitle}>
                {alreadyConfigured ? 'STK Push is on' : 'STK Push is off'}
              </Text>
              <Text style={styles.statusSub}>
                {alreadyConfigured
                  ? `Shortcode ${shop.darajaShortcode} · ${shop.darajaEnv}`
                  : 'Add your Daraja credentials to enable automatic M-Pesa prompts'}
              </Text>
            </View>
          </View>

          {alreadyConfigured && (
            <View style={styles.editHint}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
              <Text style={styles.editHintText}>
                Editing an existing setup. Leave any field blank to keep its current value.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to get credentials</Text>
            <Text style={styles.infoBody}>
              1. Register at developer.safaricom.co.ke{'\n'}
              2. Create an app on your account{'\n'}
              3. Copy the Consumer Key, Consumer Secret, and Passkey{'\n'}
              4. Use your paybill or till as the Shortcode
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Credentials</Text>
          <View style={styles.card}>
            <Field label="Consumer Key">
              <TextInput
                style={styles.input}
                placeholder={secretPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={consumerKey}
                onChangeText={setConsumerKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Field>

            <View style={styles.gap} />

            <Field label="Consumer Secret">
              <TextInput
                style={styles.input}
                placeholder={secretPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={consumerSecret}
                onChangeText={setConsumerSecret}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </Field>

            <View style={styles.gap} />

            <Field label="Passkey">
              <TextInput
                style={styles.input}
                placeholder={secretPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={passkey}
                onChangeText={setPasskey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </Field>

            <View style={styles.gap} />

            <Field label="Shortcode (paybill or till)">
              <TextInput
                style={styles.input}
                placeholder="e.g. 174379"
                placeholderTextColor={colors.textMuted}
                value={shortcode}
                onChangeText={setShortcode}
                keyboardType="number-pad"
              />
            </Field>
          </View>

          <Text style={styles.sectionLabel}>Environment</Text>
          <View style={styles.envRow}>
            {['sandbox', 'production'].map((e) => {
              const active = env === e;
              return (
                <TouchableOpacity
                  key={e}
                  style={[styles.envBtn, active && styles.envBtnActive]}
                  onPress={() => setEnv(e)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.envText, active && styles.envTextActive]}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.testBtn, (!canTest || testing) && styles.testBtnDisabled]}
            onPress={handleTest}
            disabled={!canTest || testing}
            activeOpacity={0.85}
          >
            {testing ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="pulse-outline" size={18} color={colors.primary} />
                <Text style={styles.testText}>Test connection</Text>
              </>
            )}
          </TouchableOpacity>

          {alreadyConfigured && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <Text style={styles.clearText}>Disable STK Push</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>
                {alreadyConfigured ? 'Save changes' : 'Enable STK Push'}
              </Text>
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

  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  statusCardOk: { backgroundColor: colors.successSoft },
  statusCardOff: { backgroundColor: colors.surface, ...shadows.sm },
  statusText: { flex: 1 },
  statusTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '700',
  },
  statusSub: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 2,
  },

  editHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  editHintText: {
    ...typography.tiny,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 16,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  infoBody: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },

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

  envRow: { flexDirection: 'row', gap: spacing.sm },
  envBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  envBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  envText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  envTextActive: { color: '#fff' },

  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  testBtnDisabled: { opacity: 0.4 },
  testText: {
    ...typography.bodyMedium,
    color: colors.primary,
    fontWeight: '600',
  },

  clearBtn: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  clearText: {
    ...typography.bodyMedium,
    color: colors.danger,
    fontWeight: '600',
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
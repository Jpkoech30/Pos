import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { usersApi } from '../services/users';
import { useForm } from '../hooks/useForm';
import FormInput from '../components/FormInput';
import { Screen, Card, Button, SectionLabel } from '../components/ui';
import { colors, spacing, typography } from '../theme';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ChangePasswordScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const { values, errors, setField, handleSubmit } = useForm(schema, {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      setLoading(true);
      await usersApi.changePassword(currentPassword, newPassword);
      Toast.show({
        type: 'success',
        text1: 'Password updated',
        text2: 'Use it next time you sign in',
      });
      navigation.goBack();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll edges={['bottom']}>
        <View style={styles.infoBanner}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.info} />
          <Text style={styles.infoText}>
            Choose a strong password you don't use anywhere else.
          </Text>
        </View>

        <SectionLabel>Current</SectionLabel>
        <Card style={styles.card}>
          <FormInput
            label="Current Password"
            placeholder="Enter your current password"
            value={values.currentPassword}
            onChangeText={(t) => setField('currentPassword', t)}
            error={errors.currentPassword}
            secureTextEntry
            editable={!loading}
          />
        </Card>

        <SectionLabel>New Password</SectionLabel>
        <Card style={styles.card}>
          <FormInput
            label="New Password"
            placeholder="At least 6 characters"
            value={values.newPassword}
            onChangeText={(t) => setField('newPassword', t)}
            error={errors.newPassword}
            secureTextEntry
            editable={!loading}
          />
          <FormInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={values.confirmPassword}
            onChangeText={(t) => setField('confirmPassword', t)}
            error={errors.confirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </Card>

        <Button
          title="Update Password"
          onPress={onSubmit}
          loading={loading}
          style={{ marginTop: spacing.xl }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoSoft,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  card: {
    paddingBottom: spacing.xs,
    marginBottom: spacing.xxl,
  },
});
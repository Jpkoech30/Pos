import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/users';
import { useForm } from '../../hooks/useForm';
import FormInput from '../../components/FormInput';
import { Screen, Card, Button, SectionLabel } from '../../components/ui';
import { colors, spacing, typography } from '../../theme';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
});

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const { values, errors, setField, handleSubmit } = useForm(schema, {
    name: user?.name || '',
  });

  const onSubmit = handleSubmit(async ({ name }) => {
    try {
      setLoading(true);
      const data = await usersApi.updateProfile({ name: name.trim() });
      await updateUser({ name: data.user.name });
      Toast.show({ type: 'success', text1: 'Profile updated' });
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
        <Card style={styles.formCard}>
          <FormInput
            label="Full Name"
            placeholder="Jane Doe"
            value={values.name}
            onChangeText={(t) => setField('name', t)}
            error={errors.name}
            autoCapitalize="words"
            editable={!loading}
          />
        </Card>

        <SectionLabel>Email Address</SectionLabel>
        <Card>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.hint}>
            Email can't be changed.
          </Text>
        </Card>

        <Button
          title="Save Changes"
          onPress={onSubmit}
          loading={loading}
          style={{ marginTop: spacing.xxl }}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  formCard: {
    paddingBottom: spacing.xs,
    marginBottom: spacing.xxl,
  },
  email: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
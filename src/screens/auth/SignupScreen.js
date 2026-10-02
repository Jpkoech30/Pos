import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { useForm } from '../../hooks/useForm';
import { signupSchema } from '../../utils/validators';
import FormInput from '../../components/FormInput';

export default function SignupScreen({ navigation }) {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const { values, errors, setField, handleSubmit } = useForm(signupSchema, {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      setLoading(true);
      await signUp(email.trim(), password, name.trim());
      Toast.show({
        type: 'success',
        text1: `Welcome, ${name.trim()}!`,
        text2: 'Account created successfully',
      });
      // RootNavigator auto-swaps to AppStack
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          <FormInput
            label="Full Name"
            placeholder="Jane Doe"
            value={values.name}
            onChangeText={(t) => setField('name', t)}
            error={errors.name}
            autoCapitalize="words"
            textContentType="name"
            editable={!loading}
          />

          <FormInput
            label="Email"
            placeholder="you@example.com"
            value={values.email}
            onChangeText={(t) => setField('email', t)}
            error={errors.email}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            editable={!loading}
          />

          <FormInput
            label="Password"
            placeholder="At least 6 characters"
            value={values.password}
            onChangeText={(t) => setField('password', t)}
            error={errors.password}
            secureTextEntry
            textContentType="newPassword"
            editable={!loading}
          />

          <FormInput
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={values.confirmPassword}
            onChangeText={(t) => setField('confirmPassword', t)}
            error={errors.confirmPassword}
            secureTextEntry
            textContentType="newPassword"
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 30, fontWeight: '700', textAlign: 'center', color: '#111' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 6, marginBottom: 28 },
  button: {
    backgroundColor: '#2563eb', padding: 16,
    borderRadius: 8, alignItems: 'center', marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6b7280', fontSize: 14 },
  footerLink: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
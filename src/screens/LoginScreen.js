import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { loginSchema } from '../utils/validators';
import FormInput from '../components/FormInput';

export default function LoginScreen({ navigation }) {
  const { signIn, biometricEnabled, enableBiometrics, signInWithBiometrics } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  const { values, errors, setField, handleSubmit } = useForm(loginSchema, {
    email: '',
    password: '',
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      setLoading(true);
      await signIn(email.trim(), password);

      if (!biometricEnabled) {
        Alert.alert(
          'Enable Biometric Login?',
          'Log in faster next time with your fingerprint.',
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                try {
                  await enableBiometrics();
                  Toast.show({ type: 'success', text1: 'Biometric login enabled!' });
                } catch (err) {
                  Alert.alert('Could not enable', err.message);
                }
              },
            },
          ]
        );
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Login failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  });

  const handleBiometricLogin = async () => {
    try {
      setBioLoading(true);
      const success = await signInWithBiometrics();
      if (!success) {
        Alert.alert('Biometric login cancelled');
      }
    } catch (err) {
      Alert.alert('Biometric login failed', err.message);
    } finally {
      setBioLoading(false);
    }
  };

  const busy = loading || bioLoading;

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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

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
            editable={!busy}
          />

          <FormInput
            label="Password"
            placeholder="••••••••"
            value={values.password}
            onChangeText={(t) => setField('password', t)}
            error={errors.password}
            secureTextEntry
            textContentType="password"
            editable={!busy}
          />

          <TouchableOpacity
            onPress={() =>
              Toast.show({
                type: 'info',
                text1: 'Coming soon',
                text2: 'Password reset not yet implemented',
              })
            }
            disabled={busy}
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={onSubmit}
            disabled={busy}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {biometricEnabled && (
            <TouchableOpacity
              style={[styles.bioButton, busy && styles.buttonDisabled]}
              onPress={handleBiometricLogin}
              disabled={busy}
            >
              {bioLoading ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={22} color="#2563eb" />
                  <Text style={styles.bioButtonText}>Log in with Fingerprint</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Signup')}
              disabled={busy}
            >
              <Text style={styles.footerLink}>Sign up</Text>
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
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 6, marginBottom: 32 },
  forgot: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 16 },
  forgotText: { color: '#2563eb', fontSize: 13 },
  button: {
    backgroundColor: '#2563eb', padding: 16,
    borderRadius: 8, alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
  },
  bioButtonText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#6b7280', fontSize: 14 },
  footerLink: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});
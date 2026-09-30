import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { authApi } from '../services/auth';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Restore session on cold start
  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        const email = await SecureStore.getItemAsync('email');
        const bioFlag = await SecureStore.getItemAsync('biometric_enabled');
        if (token) setUser({ token, email });
        if (bioFlag === 'true') setBiometricEnabled(true);
      } catch (e) {
        console.warn('Session restore failed', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Auto-logout on 401 from the API layer
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await signOut();
    });
  }, []);

  const signIn = async (email, password) => {
    const data = await authApi.login(email, password);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('email', data.user.email);
    setUser({ token: data.token, email: data.user.email, name: data.user.name });
  };

  const signUp = async (email, password, name) => {
    const data = await authApi.signup(email, password, name);
    await SecureStore.setItemAsync('token', data.token);
    await SecureStore.setItemAsync('email', data.user.email);
    setUser({ token: data.token, email: data.user.email, name: data.user.name });
  };

  const signOut = async () => {
    // If biometrics are enabled, keep the token on the device so the user
    // can log back in with their fingerprint. Only clear the in-memory session.
    if (biometricEnabled) {
      setUser(null);
      return;
    }

    // Full logout: wipe everything
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('email');
    await SecureStore.deleteItemAsync('biometric_enabled');
    setUser(null);
    setBiometricEnabled(false);
  };

  const enableBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) throw new Error('No biometric hardware on this device');

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) throw new Error('No fingerprint or Face ID enrolled');

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable biometric login',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      setBiometricEnabled(true);
      return true;
    }
    return false;
  };

  const signInWithBiometrics = async () => {
    if (!biometricEnabled) throw new Error('Biometric login is not enabled');

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Log in to your banking app',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      const token = await SecureStore.getItemAsync('token');
      const email = await SecureStore.getItemAsync('email');
      if (token && email) {
        setUser({ token, email });
        return true;
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        biometricEnabled,
        signIn,
        signUp,
        signOut,
        enableBiometrics,
        signInWithBiometrics,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/auth';
import { setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cold start — restore cached session immediately, then refresh in background
  useEffect(() => {
    (async () => {
      try {
        const cached = await SecureStore.getItemAsync('session');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.token) {
            setUser(parsed.user || { token: parsed.token, email: parsed.email });
            setShop(parsed.shop || null);
            setIsLoading(false);

            // Background refresh — updates silently, or signs out on 401
            try {
              const fresh = await authApi.me();
              const nextUser = {
                token: parsed.token,
                email: fresh.user.email,
                name: fresh.user.name,
                role: fresh.user.role,
                shopId: fresh.user.shopId,
              };
              setUser(nextUser);
              setShop(fresh.shop || null);
              await SecureStore.setItemAsync(
                'session',
                JSON.stringify({ token: parsed.token, user: nextUser, shop: fresh.shop }),
              );
            } catch (err) {
              // 401 → interceptor already signed out. Other errors → keep cache.
            }
            return;
          }
        }
      } catch (e) {
        console.warn('Session restore failed', e.message);
      }
      setIsLoading(false);
    })();
  }, []);

  // Auto sign-out on 401
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      await signOut();
    });
  }, []);

  const persistSession = async (token, userObj, shopObj) => {
    await SecureStore.setItemAsync(
      'session',
      JSON.stringify({ token, user: userObj, shop: shopObj }),
    );
    // Legacy keys, kept for compatibility with anything still reading them
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('email', userObj.email);
  };

  const signIn = async (email, password) => {
    const data = await authApi.login(email, password);
    const u = {
      token: data.token,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      shopId: data.user.shopId,
    };
    setUser(u);
    setShop(data.shop || null);
    await persistSession(data.token, u, data.shop);
  };

  const signUp = async (email, password, name, shopName) => {
    const data = await authApi.signup(email, password, name, shopName);
    const u = {
      token: data.token,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role,
      shopId: data.user.shopId,
    };
    setUser(u);
    setShop(data.shop || null);
    await persistSession(data.token, u, data.shop);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('session');
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('email');
    setUser(null);
    setShop(null);
  };

  const refreshShop = async () => {
    try {
      const fresh = await authApi.me();
      setShop(fresh.shop || null);
      setUser((prev) => {
        const next = prev
          ? { ...prev, name: fresh.user.name, role: fresh.user.role }
          : prev;
        if (next) {
          SecureStore.setItemAsync(
            'session',
            JSON.stringify({ token: next.token, user: next, shop: fresh.shop }),
          ).catch(() => {});
        }
        return next;
      });
      return fresh.shop;
    } catch (err) {
      console.warn('refreshShop failed', err.message);
      return null;
    }
  };

  const isOwner = user?.role === 'owner';
  const isManager = user?.role === 'manager' || isOwner;

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        isLoading,
        isOwner,
        isManager,
        signIn,
        signUp,
        signOut,
        refreshShop,
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
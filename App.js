import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { ShiftProvider } from './src/context/ShiftContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <ShiftProvider>
            <RootNavigator />
            <StatusBar style="auto" />
            <Toast />
          </ShiftProvider>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
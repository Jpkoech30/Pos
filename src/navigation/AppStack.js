import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- Screens ---
import SaleScreen from '../screens/SaleScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ScannerScreen from '../screens/ScannerScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import MpesaPaymentScreen from '../screens/MpesaPaymentScreen';
import CashPaymentScreen from '../screens/CashPaymentScreen';
import StkPushScreen from '../screens/StkPushScreen';

import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import ProductFormScreen from '../screens/ProductFormScreen';

import OrdersScreen from '../screens/OrdersScreen';

import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';

import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const SaleStack = createNativeStackNavigator();
const ProductsStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function SaleStackNavigator() {
  return (
    <SaleStack.Navigator>
      <SaleStack.Screen name="SaleHome" component={SaleScreen} options={{ headerShown: false }} />
      <SaleStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <SaleStack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
      <SaleStack.Screen name="MpesaPayment" component={MpesaPaymentScreen} options={{ headerShown: false }} />
      <SaleStack.Screen name="CashPayment" component={CashPaymentScreen} options={{ headerShown: false }} />
      <SaleStack.Screen name="StkPush" component={StkPushScreen} options={{ headerShown: false }} />
      <SaleStack.Screen name="Receipt" component={ReceiptScreen} options={{ headerShown: false, gestureEnabled: false }} />
    </SaleStack.Navigator>
  );
}

function ProductsStackNavigator() {
  return (
    <ProductsStack.Navigator>
      <ProductsStack.Screen name="ProductsHome" component={ProductsScreen} options={{ headerShown: false }} />
      <ProductsStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Product' }} />
      <ProductsStack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'Product' }} />
    </ProductsStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen name="OrdersHome" component={OrdersScreen} options={{ headerShown: false }} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
    </ProfileStack.Navigator>
  );
}

const TAB_ICONS = {
  Sale: 'cart-outline',
  Products: 'cube-outline',
  Orders: 'receipt-outline',
  Profile: 'person-outline',
};

export default function AppStack() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen
        name="Sale"
        component={SaleStackNavigator}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'SaleHome';
          if (
            routeName === 'Scanner' ||
            routeName === 'Receipt' ||
            routeName === 'MpesaPayment' ||
            routeName === 'CashPayment' ||
            routeName === 'StkPush'
          ) {
            return { tabBarStyle: { display: 'none' } };
          }
          return {
            tabBarStyle: {
              borderTopColor: colors.border,
              height: 60,
              paddingBottom: 6,
              paddingTop: 6,
            },
          };
        }}
      />
      <Tab.Screen name="Products" component={ProductsStackNavigator} />
      <Tab.Screen name="Orders" component={OrdersStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
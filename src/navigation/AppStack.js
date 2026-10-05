import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// --- Sale ---
import SaleScreen from '../screens/sale/SaleScreen';
import CheckoutScreen from '../screens/sale/CheckoutScreen';
import SaleScannerScreen from '../screens/sale/SaleScannerScreen';
import MpesaPaymentScreen from '../screens/sale/MpesaPaymentScreen';
import CashPaymentScreen from '../screens/sale/CashPaymentScreen';
import StkPushScreen from '../screens/sale/StkPushScreen';
import ReceiptScreen from '../screens/sale/ReceiptScreen';

// --- Products ---
import ProductsScreen from '../screens/products/ProductsScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import ProductFormScreen from '../screens/products/ProductFormScreen';
import ProductScannerScreen from '../screens/products/ProductScannerScreen';

// --- Orders ---
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import DailyAnalyticsScreen from '../screens/orders/DailyAnalyticsScreen';

// --- Profile ---
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ShopSettingsScreen from '../screens/profile/ShopSettingsScreen';
import PaymentSettingsScreen from '../screens/profile/PaymentSettingsScreen';
import TeamScreen from '../screens/profile/TeamScreen';
import TaxCenterScreen from '../screens/profile/TaxCenterScreen';

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
      <SaleStack.Screen name="Scanner" component={SaleScannerScreen} options={{ headerShown: false }} />
      <SaleStack.Screen name="ProductForm" component={ProductFormScreen} options={{ title: 'New Product' }} />
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
      <ProductsStack.Screen name="Scanner" component={ProductScannerScreen} options={{ headerShown: false }} />
    </ProductsStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen name="OrdersHome" component={OrdersScreen} options={{ headerShown: false }} />
      <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
      <OrdersStack.Screen name="DailyAnalytics" component={DailyAnalyticsScreen} options={{ title: 'Daily Analytics' }} />
    </OrdersStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />
      <ProfileStack.Screen name="ShopSettings" component={ShopSettingsScreen} options={{ title: 'Shop settings' }} />
      <ProfileStack.Screen name="PaymentSettings" component={PaymentSettingsScreen} options={{ title: 'STK Push' }} />
      <ProfileStack.Screen name="Team" component={TeamScreen} options={{ title: 'Team' }} />
      <ProfileStack.Screen name="TaxCenter" component={TaxCenterScreen} options={{ title: 'Tax Center' }} />
    </ProfileStack.Navigator>
  );
}

const TAB_ICONS = {
  Sale: 'cart-outline',
  Products: 'cube-outline',
  Orders: 'receipt-outline',
  Profile: 'person-outline',
};

const HIDDEN_TABBAR_ROUTES = [
  'Scanner',
  'Receipt',
  'MpesaPayment',
  'CashPayment',
  'StkPush',
];

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
          if (HIDDEN_TABBAR_ROUTES.includes(routeName)) {
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
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import { useCart } from '../context/CartContext';
import { productsApi } from '../services/products';
import { colors, spacing, typography, radii, shadows } from '../theme';

const BOX_W = 280;
const BOX_H = 160;
const BOX_TOP_RATIO = 0.38;

const IDLE_COLOR = 'rgba(255,255,255,0.9)';
const FOUND_COLOR = '#00C853';

// How long after a scan before we accept the next one.
// Prevents the same barcode being re-read while it's still in frame.
const SCAN_COOLDOWN = 800;

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [looking, setLooking] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [justAdded, setJustAdded] = useState(null);
  const lastScanRef = useRef(0);

  const { items, addToCart, count, subtotal } = useCart();

  const sweepAnim = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;

  // Sweep animation while idle
  useEffect(() => {
    let loop;
    if (!looking) {
      sweepAnim.setValue(0);
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(sweepAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(sweepAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [looking, sweepAnim]);

  const flashAdded = (name) => {
    setJustAdded(name);
    flashOpacity.setValue(1);
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => setJustAdded(null));
  };

  const handleBarcodeScanned = async ({ data }) => {
    const now = Date.now();
    if (scanned || looking || now - lastScanRef.current < SCAN_COOLDOWN) return;
    lastScanRef.current = now;
    setScanned(true);
    setLooking(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    try {
      const { product } = await productsApi.lookup(data);

      if (!product) {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        ).catch(() => {});
        Toast.show({ type: 'error', text1: 'Not found', text2: data });
        setLooking(false);
        setTimeout(() => setScanned(false), SCAN_COOLDOWN);
        return;
      }

      addToCart(product);
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      ).catch(() => {});
      flashAdded(product.name);

      // Re-enable scanning for the next item
      setLooking(false);
      setTimeout(() => setScanned(false), SCAN_COOLDOWN);
    } catch (err) {
      Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
      Toast.show({
        type: 'error',
        text1: 'Lookup failed',
        text2: err.message,
      });
      setLooking(false);
      setTimeout(() => setScanned(false), SCAN_COOLDOWN);
    }
  };

  if (!permission) {
    return (
      <View style={styles.root}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!permission.granted) {
    requestPermission();
    return (
      <View style={styles.root}>
        <Text style={styles.permText}>Camera permission needed</Text>
      </View>
    );
  }

  const previewHeight = size.width * (4 / 3);
  const scale =
    previewHeight > 0
      ? Math.max(1, (size.height / previewHeight) * 1.06)
      : 1;

  const boxTop = size.height > 0 ? size.height * BOX_TOP_RATIO - BOX_H / 2 : 0;
  const boxLeft = size.width > 0 ? (size.width - BOX_W) / 2 : 0;

  const cornerColor = looking ? FOUND_COLOR : IDLE_COLOR;
  const cornerWidth = looking ? 5 : 3;

  const sweepTranslateY = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, BOX_H - 10],
  });

  return (
    <View
      style={styles.root}
      onLayout={(e) => setSize(e.nativeEvent.layout)}
    >
      <CameraView
        style={[styles.camera, { transform: [{ scale }] }]}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
          ],
        }}
      />

      {size.height > 0 && (
        <View
          style={[
            styles.box,
            { position: 'absolute', top: boxTop, left: boxLeft },
          ]}
          pointerEvents="none"
        >
          {!looking && (
            <Animated.View
              style={[
                styles.sweepLine,
                { transform: [{ translateY: sweepTranslateY }] },
              ]}
            />
          )}

          <View
            style={[
              styles.corner,
              styles.cornerTL,
              {
                borderColor: cornerColor,
                borderTopWidth: cornerWidth,
                borderLeftWidth: cornerWidth,
              },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerTR,
              {
                borderColor: cornerColor,
                borderTopWidth: cornerWidth,
                borderRightWidth: cornerWidth,
              },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBL,
              {
                borderColor: cornerColor,
                borderBottomWidth: cornerWidth,
                borderLeftWidth: cornerWidth,
              },
            ]}
          />
          <View
            style={[
              styles.corner,
              styles.cornerBR,
              {
                borderColor: cornerColor,
                borderBottomWidth: cornerWidth,
                borderRightWidth: cornerWidth,
              },
            ]}
          />
        </View>
      )}

      {/* Status text / last added */}
      {size.height > 0 && (
        <View
          style={[styles.statusWrap, { top: boxTop + BOX_H + 24 }]}
          pointerEvents="none"
        >
          {justAdded ? (
            <Animated.View
              style={[styles.statusBubble, { opacity: flashOpacity }]}
            >
              <Ionicons name="checkmark-circle" size={18} color={FOUND_COLOR} />
              <Text style={styles.statusAdded}>{justAdded}</Text>
            </Animated.View>
          ) : (
            <Text style={styles.statusText}>
              {looking ? 'Looking up…' : 'Align barcode in the frame'}
            </Text>
          )}
        </View>
      )}

      {looking && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Looking up…</Text>
        </View>
      )}

      {/* Cart bar at the bottom */}
      {items.length > 0 && (
        <View style={styles.cartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
            <Text style={styles.cartTotal}>
              KSh {subtotal.toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={() => navigation.replace('Checkout')}
            activeOpacity={0.85}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.close}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },

  camera: {
    flex: 1,
    alignSelf: 'stretch',
  },

  permText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 200,
  },

  box: {
    width: BOX_W,
    height: BOX_H,
  },

  sweepLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: FOUND_COLOR,
    opacity: 0.85,
    borderRadius: 1,
    shadowColor: FOUND_COLOR,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },

  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  cornerTL: { top: 0, left: 0, borderTopLeftRadius: 10 },
  cornerTR: { top: 0, right: 0, borderTopRightRadius: 10 },
  cornerBL: { bottom: 0, left: 0, borderBottomLeftRadius: 10 },
  cornerBR: { bottom: 0, right: 0, borderBottomRightRadius: 10 },

  statusWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusAdded: {
    color: FOUND_COLOR,
    fontSize: 14,
    fontWeight: '600',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },

  cartBar: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    bottom: spacing.screenPadding,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.lg,
  },
  cartInfo: { flex: 1, marginLeft: spacing.sm },
  cartCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  cartTotal: {
    ...typography.h3,
    color: colors.text,
    marginTop: 2,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    gap: spacing.sm,
  },
  checkoutText: {
    ...typography.button,
    color: colors.textInverse,
  },

  close: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
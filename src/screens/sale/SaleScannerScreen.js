import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import CameraScanner from '../../components/CameraScanner';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productsApi } from '../../services/products';
import { formatKsh } from '../../utils/format';

const WINDOW_HEIGHT = 140;

export default function SaleScannerScreen({ navigation }) {
  const [paused, setPaused] = useState(false);
  const [lastScanned, setLastScanned] = useState(null);
  const [pendingAdd, setPendingAdd] = useState(null);
  const lastScanRef = useRef(0);

  const { addToCart, count, total } = useCart();
  const { isManager } = useAuth();

  const handleScan = async ({ data }) => {
    const now = Date.now();
    if (paused || now - lastScanRef.current < 1500) return;
    lastScanRef.current = now;
    setPaused(true);
    setPendingAdd(null);
    setLastScanned(null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const { product } = await productsApi.lookup(data);

      if (!product) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        if (isManager) {
          setPendingAdd({ code: data });
        } else {
          setLastScanned({ ok: false, name: 'Not found' });
          setTimeout(() => {
            setPaused(false);
            setLastScanned(null);
          }, 1800);
        }
        return;
      }

      addToCart(product);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setLastScanned({ ok: true, name: product.name });
      setTimeout(() => {
        setPaused(false);
        setLastScanned(null);
      }, 1500);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setLastScanned({ ok: false, name: err.message });
      setTimeout(() => {
        setPaused(false);
        setLastScanned(null);
      }, 1800);
    }
  };

  const handleAddProduct = () => {
    if (!pendingAdd) return;
    const code = pendingAdd.code;
    setPendingAdd(null);
    setPaused(false);
    navigation.navigate({
      name: 'ProductForm',
      params: { scannedBarcode: code, scanTs: Date.now(), returnToSale: true },
      merge: true,
    });
  };

  const handleDismiss = () => {
    setPendingAdd(null);
    setPaused(false);
  };

  return (
    <CameraScanner
      onScan={handleScan}
      paused={paused}
      onClose={() => navigation.goBack()}
      hintText={!lastScanned && !pendingAdd ? 'Point at a barcode' : null}
    >
      {/* Top bar — cart summary */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Ionicons name="cart-outline" size={18} color="#fff" />
          <Text style={styles.topCount}>
            {count} {count === 1 ? 'item' : 'items'}
          </Text>
        </View>
        <Text style={styles.topTotal}>{formatKsh(total)}</Text>
      </View>

      {/* Scan feedback pill */}
      {lastScanned && (
        <View style={styles.belowWindow} pointerEvents="none">
          <View
            style={[
              styles.feedback,
              lastScanned.ok ? styles.feedbackOk : styles.feedbackFail,
            ]}
          >
            <Ionicons
              name={lastScanned.ok ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color="#fff"
            />
            <Text style={styles.feedbackText} numberOfLines={1}>
              {lastScanned.name}
            </Text>
          </View>
        </View>
      )}

      {/* Not-found prompt for managers */}
      {pendingAdd && (
        <View style={styles.belowWindow}>
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
              <Text style={styles.promptTitle}>Not in your shop</Text>
            </View>
            <Text style={styles.promptCode}>{pendingAdd.code}</Text>
            <View style={styles.promptActions}>
              <TouchableOpacity
                style={[styles.promptBtn, styles.promptCancel]}
                onPress={handleDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.promptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.promptBtn, styles.promptAdd]}
                onPress={handleAddProduct}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.promptAddText}>Add product</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </CameraScanner>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topCount: { color: '#fff', fontSize: 14, fontWeight: '600' },
  topTotal: { color: '#fff', fontSize: 18, fontWeight: '700' },

  belowWindow: {
    position: 'absolute',
    top: '50%',
    marginTop: WINDOW_HEIGHT / 2 + 16,
    left: 20,
    right: 20,
    alignItems: 'center',
  },

  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    maxWidth: '100%',
  },
  feedbackOk: { backgroundColor: 'rgba(57, 181, 74, 0.95)' },
  feedbackFail: { backgroundColor: 'rgba(236, 26, 35, 0.95)' },
  feedbackText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },

  promptCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  promptTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  promptCode: {
    color: '#9CA3AF',
    fontSize: 13,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  promptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  promptCancel: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptCancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  promptAdd: {
    backgroundColor: '#39B54A',
  },
  promptAddText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
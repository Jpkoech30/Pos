import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const WINDOW_WIDTH = 280;
const WINDOW_HEIGHT = 140;
const CORNER_LEN = 26;
const CORNER_WIDTH = 4;

export default function CameraScanner({
  onScan,
  paused = false,
  onClose,
  hintText,
  children,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  React.useEffect(() => {
    if (permission && !permission.granted) requestPermission();
  }, [permission]);

  if (!permission?.granted) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      {/* The one style that must not change */}
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        onCameraReady={() => setCameraReady(true)}
        onBarcodeScanned={paused ? undefined : onScan}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13', 'ean8', 'upc_a', 'upc_e',
            'code128', 'code39', 'itf14',
          ],
        }}
      />

      {!cameraReady && (
        <View style={styles.blockingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.blockingText}>Starting camera…</Text>
        </View>
      )}

      <View style={styles.brackets} pointerEvents="none">
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>

      {hintText && (
        <View style={styles.hintWrap} pointerEvents="none">
          <Text style={styles.hintText}>{hintText}</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.toolBtn, torchOn && styles.toolBtnActive]}
          onPress={() => setTorchOn((v) => !v)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={torchOn ? 'flashlight' : 'flashlight-outline'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity
            style={[styles.toolBtn, styles.closeBtn]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Caller-provided chrome — top bar, feedback pill, prompts */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },

  blockingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockingText: { color: '#fff', fontSize: 13, marginTop: 12 },

  brackets: {
    position: 'absolute',
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    left: '50%',
    top: '50%',
    marginLeft: -WINDOW_WIDTH / 2,
    marginTop: -WINDOW_HEIGHT / 2,
  },
  corner: {
    position: 'absolute',
    width: CORNER_LEN,
    height: CORNER_LEN,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 12,
  },

  hintWrap: {
    position: 'absolute',
    top: '50%',
    marginTop: WINDOW_HEIGHT / 2 + 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: '#fff',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  toolBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  toolBtnActive: { backgroundColor: 'rgba(57, 181, 74, 0.9)' },
  closeBtn: { backgroundColor: 'rgba(0,0,0,0.7)' },
});
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ACTIONS = [
  { key: 'send', label: 'Send', icon: 'arrow-up-circle-outline' },
  { key: 'request', label: 'Request', icon: 'arrow-down-circle-outline' },
  { key: 'pay', label: 'Pay Bills', icon: 'receipt-outline' },
  { key: 'more', label: 'More', icon: 'ellipsis-horizontal' },
];

export default function QuickActions() {
  const handlePress = (action) => {
    Alert.alert(action.label, 'Coming soon');
  };

  return (
    <View style={styles.row}>
      {ACTIONS.map((a) => (
        <TouchableOpacity key={a.key} style={styles.item} onPress={() => handlePress(a)}>
          <View style={styles.iconWrap}>
            <Ionicons name={a.icon} size={22} color="#2563eb" />
          </View>
          <Text style={styles.label}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  item: { alignItems: 'center', flex: 1 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 12, color: '#475569', fontWeight: '500' },
});
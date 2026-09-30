import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TYPES = {
  checking: { icon: 'card-outline', color: '#2563eb', bg: '#eff6ff' },
  savings: { icon: 'wallet-outline', color: '#059669', bg: '#ecfdf5' },
  credit: { icon: 'card', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function AccountCard({ account }) {
  const meta = TYPES[account.type] || TYPES.checking;
  const isNegative = account.balance < 0;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
        <Ionicons name={meta.icon} size={22} color={meta.color} />
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{account.name}</Text>
        <Text style={styles.number}>{account.accountNumber}</Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.balance, isNegative && styles.balanceNegative]}>
          {isNegative ? '-' : ''}${Math.abs(account.balance).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
        <Text style={styles.type}>{account.type.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 2 },
  number: { fontSize: 12, color: '#94a3b8', letterSpacing: 0.3 },
  right: { alignItems: 'flex-end' },
  balance: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  balanceNegative: { color: '#dc2626' },
  type: { fontSize: 10, color: '#94a3b8', marginTop: 3, letterSpacing: 0.6, fontWeight: '600' },
});
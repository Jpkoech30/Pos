import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { accountsApi } from '../services/accounts';
import AccountCard from '../components/AccountCard';
import QuickActions from '../components/QuickActions';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);

  const loadAccounts = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await accountsApi.list();
      setAccounts(data.accounts);
      setTotalBalance(data.totalBalance);
    } catch (err) {
      setError(err.message);
      if (isRefresh) {
        Toast.show({ type: 'error', text1: 'Refresh failed', text2: err.message });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAccounts(true);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const formattedBalance = `$${totalBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (error && accounts.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color="#94a3b8" />
        <Text style={styles.errorTitle}>Couldn't load accounts</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadAccounts()}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AccountCard account={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        ListHeaderComponent={
          <View>
            <LinearGradient
              colors={['#1e3a8a', '#2563eb', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <SafeAreaView edges={['top']}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.greeting}>{greeting()},</Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {user?.name || user?.email?.split('@')[0] || 'there'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.balanceBlock}>
                  <View style={styles.balanceLabelRow}>
                    <Text style={styles.balanceLabel}>Total Balance</Text>
                    <TouchableOpacity onPress={() => setHideBalance((v) => !v)}>
                      <Ionicons
                        name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#cbd5e1"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.balanceValue}>
                    {hideBalance ? '••••••' : formattedBalance}
                  </Text>
                </View>
              </SafeAreaView>
            </LinearGradient>

            <View style={styles.body}>
              <QuickActions />
              <Text style={styles.sectionTitle}>Your Accounts</Text>
            </View>
          </View>
        }
        ListFooterComponent={<View style={{ height: 24 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f1f5f9' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 24, backgroundColor: '#f1f5f9',
  },
  listContent: { paddingBottom: 24 },

  hero: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  greeting: { color: '#c7d2fe', fontSize: 13, marginBottom: 2 },
  name: { color: '#fff', fontSize: 20, fontWeight: '700' },
  iconButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  balanceBlock: { marginBottom: 8 },
  balanceLabelRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  balanceLabel: { color: '#cbd5e1', fontSize: 13, letterSpacing: 0.3 },
  balanceValue: { color: '#fff', fontSize: 38, fontWeight: '800', letterSpacing: -0.5 },

  body: { paddingHorizontal: 20, marginTop: -32 },

  sectionTitle: {
    fontSize: 16, fontWeight: '700',
    color: '#0f172a', marginBottom: 12,
  },

  errorTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 12, marginBottom: 6 },
  errorMessage: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  retryButton: {
    backgroundColor: '#2563eb', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 10,
  },
  retryText: { color: '#fff', fontWeight: '600' },
});
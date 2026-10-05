import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
};

export default function ProfileScreen({ navigation }) {
  const { user, shop, isOwner, isManager, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Sign out failed', text2: err.message });
    }
  };

  const initials = (user?.name || user?.email || '?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const taxHint = shop?.vatRegistered
    ? `VAT · ${shop.vatRate || 16}%`
    : 'Turnover Tax · 1.5%';

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Unnamed'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {ROLE_LABELS[user?.role] || user?.role || '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* Shop card */}
        {shop && (
          <View style={styles.shopCard}>
            <View style={styles.shopHeader}>
              <Ionicons name="storefront-outline" size={18} color={colors.primary} />
              <Text style={styles.shopLabel}>Your shop</Text>
            </View>
            <Text style={styles.shopName}>{shop.name}</Text>
            {shop.mpesaNumber && (
              <Text style={styles.shopMeta}>Pochi · {shop.mpesaNumber}</Text>
            )}
            {shop.stkEnabled && (
              <View style={styles.stkBadge}>
                <Ionicons name="flash" size={11} color={colors.success} />
                <Text style={styles.stkBadgeText}>STK Push enabled</Text>
              </View>
            )}
          </View>
        )}

        {/* Shop settings — owner + manager */}
        {isManager && (
          <>
            <Text style={styles.sectionLabel}>Shop</Text>
            <View style={styles.card}>
              <Row
                icon="storefront-outline"
                label="Shop details"
                hint="Name, address, Pochi number"
                onPress={() => navigation.navigate('ShopSettings')}
              />
              <Divider />
              <Row
                icon="flash-outline"
                label="STK Push"
                hint={shop?.stkEnabled ? 'Configured' : 'Not configured'}
                onPress={() => navigation.navigate('PaymentSettings')}
              />
            </View>
          </>
        )}

        {/* Tax — owner only */}
        {isOwner && (
          <>
            <Text style={styles.sectionLabel}>Tax</Text>
            <View style={styles.card}>
              <Row
                icon="calculator-outline"
                label="Tax Center"
                hint={taxHint}
                onPress={() => navigation.navigate('TaxCenter')}
              />
            </View>
          </>
        )}

        {/* Team — owner only */}
        {isOwner && (
          <>
            <Text style={styles.sectionLabel}>Team</Text>
            <View style={styles.card}>
              <Row
                icon="people-outline"
                label="Staff"
                hint="Add, remove, manage roles"
                onPress={() => navigation.navigate('Team')}
              />
            </View>
          </>
        )}

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Row
            icon="person-outline"
            label="Edit profile"
            hint="Your name"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <Divider />
          <Row
            icon="lock-closed-outline"
            label="Change password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, hint, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  userInfo: { flex: 1 },
  userName: { ...typography.h3, color: colors.text },
  userEmail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: spacing.xs,
  },
  rolePillText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '700',
  },

  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  shopLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  shopName: { ...typography.h3, color: colors.text },
  shopMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  stkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    marginTop: spacing.sm,
  },
  stkBadgeText: {
    ...typography.tiny,
    color: colors.success,
    fontWeight: '700',
  },

  sectionLabel: {
    ...typography.overline,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  rowHint: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 32 + spacing.md,
  },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  signOutText: {
    ...typography.bodyMedium,
    color: colors.danger,
    fontWeight: '600',
  },
});
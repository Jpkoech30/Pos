import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { useShift } from '../../context/ShiftContext';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
};

const ROLE_DESCRIPTIONS = {
  owner: 'Full access to every screen',
  manager: 'Everything except shop settings',
  cashier: 'Sales and own shift only',
};

export default function ProfileScreen({ navigation }) {
  const { user, shop, isOwner, isManager, signOut } = useAuth();
  const { checkOut } = useShift();

  const handleSignOut = async () => {
    try {
      // Close any open shift first — the token is still valid here.
      // After signOut, AuthContext clears the token and any backend
      // call would 401.
      await checkOut();
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
            <View style={styles.roleRow}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>
                  {ROLE_LABELS[user?.role] || user?.role || '—'}
                </Text>
              </View>
              <Text style={styles.roleDesc}>
                {ROLE_DESCRIPTIONS[user?.role] || ''}
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
            <View style={styles.badgesRow}>
              {shop.stkEnabled && (
                <View style={styles.stkBadge}>
                  <Ionicons name="flash" size={11} color={colors.success} />
                  <Text style={styles.stkBadgeText}>STK Push</Text>
                </View>
              )}
              {shop.vatRegistered && (
                <View style={styles.vatBadge}>
                  <Ionicons name="receipt-outline" size={11} color={colors.primary} />
                  <Text style={styles.vatBadgeText}>VAT registered</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Shop section — owner + manager */}
        {isManager && (
          <>
            <Text style={styles.sectionLabel}>Shop setup</Text>
            <Text style={styles.sectionHint}>
              Control how your shop looks and how customers pay you.
            </Text>
            <View style={styles.card}>
              <Row
                icon="storefront-outline"
                label="Shop details"
                hint="Change your shop name, address, and Pochi number"
                onPress={() => navigation.navigate('ShopSettings')}
              />
              <Divider />
              <Row
                icon="flash-outline"
                label="M-Pesa STK Push"
                hint={
                  shop?.stkEnabled
                    ? 'Connected to Safaricom — customers get automatic payment prompts'
                    : 'Not set up yet — connect to enable automatic M-Pesa prompts'
                }
                hintTone={shop?.stkEnabled ? 'success' : 'muted'}
                onPress={() => navigation.navigate('PaymentSettings')}
              />
              {isOwner && (
                <>
                  <Divider />
                  <Row
                    icon="receipt-outline"
                    label="Tax Center"
                    hint={
                      shop?.vatRegistered
                        ? 'VAT registered · view what you owe KRA this month'
                        : 'Track VAT or Turnover Tax and see your monthly liability'
                    }
                    hintTone={shop?.vatRegistered ? 'success' : 'muted'}
                    onPress={() => navigation.navigate('TaxCenter')}
                  />
                </>
              )}
            </View>
          </>
        )}

        {/* Team section — owner only */}
        {isOwner && (
          <>
            <Text style={styles.sectionLabel}>Team</Text>
            <Text style={styles.sectionHint}>
              Add cashiers and managers, set their check-in PINs, and control what they can see.
            </Text>
            <View style={styles.card}>
              <Row
                icon="people-outline"
                label="Staff & PINs"
                hint="Add people, assign roles, set the 4-digit PIN they use to check in at the till"
                onPress={() => navigation.navigate('Team')}
              />
            </View>
          </>
        )}

        {/* Account section */}
        <Text style={styles.sectionLabel}>Your account</Text>
        <Text style={styles.sectionHint}>
          Your personal login — separate from anyone else who uses the shop device.
        </Text>
        <View style={styles.card}>
          <Row
            icon="person-outline"
            label="Edit profile"
            hint="Change the name shown on your receipts and the app"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <Divider />
          <Row
            icon="lock-closed-outline"
            label="Change password"
            hint="Update the password you use to log in to the app"
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

        <Text style={styles.signOutHint}>
          Signs you out and closes any open shift. The next person must log in with their own account.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, hint, hintTone = 'muted', onPress }) {
  const hintColor = hintTone === 'success' ? colors.success : colors.textMuted;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && (
          <Text style={[styles.rowHint, { color: hintColor }]}>{hint}</Text>
        )}
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
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: {
    ...typography.h3, color: colors.primary, fontWeight: '700',
  },
  userInfo: { flex: 1 },
  userName: { ...typography.h3, color: colors.text },
  userEmail: {
    ...typography.caption, color: colors.textMuted, marginTop: 2,
  },
  roleRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginTop: spacing.xs,
  },
  rolePill: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.pill,
  },
  rolePillText: {
    ...typography.tiny, color: colors.primary, fontWeight: '700',
  },
  roleDesc: {
    ...typography.tiny, color: colors.textMuted,
    fontStyle: 'italic', flex: 1,
  },

  shopCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  shopHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, marginBottom: spacing.xs,
  },
  shopLabel: {
    ...typography.tiny, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700',
  },
  shopName: { ...typography.h3, color: colors.text },
  shopMeta: {
    ...typography.caption, color: colors.textMuted, marginTop: spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  stkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.pill,
  },
  stkBadgeText: {
    ...typography.tiny, color: colors.success, fontWeight: '700',
  },
  vatBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.pill,
  },
  vatBadgeText: {
    ...typography.tiny, color: colors.primary, fontWeight: '700',
  },

  sectionLabel: {
    ...typography.overline, color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.lg, marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionHint: {
    ...typography.tiny, color: colors.textSecondary,
    marginBottom: spacing.sm, marginLeft: spacing.xs,
    lineHeight: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  rowIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    ...typography.bodyMedium, color: colors.text, fontWeight: '600',
  },
  rowHint: {
    ...typography.tiny, marginTop: 2, lineHeight: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 32 + spacing.md,
  },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl, paddingVertical: spacing.md,
  },
  signOutText: {
    ...typography.bodyMedium, color: colors.danger, fontWeight: '600',
  },
  signOutHint: {
    ...typography.tiny, color: colors.textMuted,
    textAlign: 'center', paddingHorizontal: spacing.lg,
    lineHeight: 16, marginTop: -spacing.sm,
  },
});
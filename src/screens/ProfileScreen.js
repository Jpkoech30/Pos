import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/users';
import { Screen, Card, Divider, SectionLabel } from '../components/ui';
import { colors, spacing, typography, radii } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const data = await usersApi.getProfile();
      setProfile(data.user);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not load profile', text2: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', loadProfile);
    return unsub;
  }, [navigation, loadProfile]);

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const initials = (profile?.name || user?.email || '?')
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  if (loading && !profile) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      {/* HERO */}
      <Card variant="spacious" style={styles.hero}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
        <Text style={styles.name}>{profile?.name || 'Unnamed User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>

        {memberSince ? (
          <View style={styles.pill}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.pillText}>Member since {memberSince}</Text>
          </View>
        ) : null}
      </Card>

      {/* ACCOUNT */}
      <SectionLabel>Account</SectionLabel>
      <Card variant="flat" style={styles.group}>
        <Row
          icon="person-outline"
          label="Edit Profile"
          sublabel="Update your name"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <Divider inset />
        <Row
          icon="lock-closed-outline"
          label="Change Password"
          sublabel="Keep your account secure"
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </Card>

      {/* SECURITY */}
      <SectionLabel>Security</SectionLabel>
      <Card variant="flat" style={styles.group}>
        <Row
          icon="log-out-outline"
          label="Log Out"
          sublabel="Sign out of this device"
          onPress={handleLogout}
          destructive
        />
      </Card>

      <Text style={styles.version}>v1.0.0</Text>
    </Screen>
  );
}

function Row({ icon, label, sublabel, onPress, destructive }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.rowIcon, destructive && styles.rowIconDanger]}>
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? colors.danger : colors.primary}
        />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>
          {label}
        </Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.textInverse,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginTop: spacing.lg,
    gap: 6,
  },
  pillText: {
    ...typography.tiny,
    color: colors.textMuted,
  },

  group: {
    marginBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowIconDanger: { backgroundColor: colors.dangerSoft },
  rowBody: { flex: 1 },
  rowLabel: { ...typography.bodyMedium, color: colors.text },
  rowSublabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },

  version: {
    ...typography.tiny,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
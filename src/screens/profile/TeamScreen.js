import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { useAuth } from '../../context/AuthContext';
import { staffApi } from '../../services/staff';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const ROLE_LABELS = {
  owner: 'Owner',
  manager: 'Manager',
  cashier: 'Cashier',
};

export default function TeamScreen() {
  const { user: me } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await staffApi.list();
      setStaff(data.staff || []);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to load', text2: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleToggleActive = async (person) => {
    try {
      if (person.isActive) {
        await staffApi.deactivate(person.id);
        Toast.show({ type: 'info', text1: `${person.name} deactivated` });
      } else {
        await staffApi.activate(person.id);
        Toast.show({ type: 'success', text1: `${person.name} activated` });
      }
      load(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
    }
  };

  const handleRoleChange = async (person, role) => {
    try {
      await staffApi.setRole(person.id, role);
      Toast.show({ type: 'success', text1: 'Role updated' });
      load(true);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed', text2: err.message });
    }
  };

  const handleAdd = async ({ email, name, password, role }) => {
    await staffApi.create({ email, name, password, role });
    setShowAdd(false);
    Toast.show({ type: 'success', text1: 'Staff added' });
    load(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <FlatList
        data={staff}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAdd(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add staff</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <StaffRow
            person={item}
            isMe={String(item.id) === String(me?.id)}
            onToggleActive={() => handleToggleActive(item)}
            onRoleChange={(role) => handleRoleChange(item, role)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No staff yet</Text>
            <Text style={styles.emptySub}>
              Add a manager or cashier to give them access
            </Text>
          </View>
        }
      />

      <AddStaffModal
        visible={showAdd}
        onCancel={() => setShowAdd(false)}
        onSubmit={handleAdd}
      />
    </SafeAreaView>
  );
}

function StaffRow({ person, isMe, onToggleActive, onRoleChange }) {
  const [expanded, setExpanded] = useState(false);

  const initials = (person.name || person.email || '?')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.card, !person.isActive && styles.cardInactive]}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.7}
        disabled={isMe}
      >
        <View style={[styles.avatar, !person.isActive && styles.avatarOff]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowNameLine}>
            <Text style={styles.rowName}>{person.name}</Text>
            {isMe && <Text style={styles.youTag}>You</Text>}
            {!person.isActive && <Text style={styles.offTag}>Inactive</Text>}
          </View>
          <Text style={styles.rowEmail}>{person.email}</Text>
        </View>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>
            {ROLE_LABELS[person.role] || person.role}
          </Text>
        </View>
        {!isMe && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
        )}
      </TouchableOpacity>

      {expanded && !isMe && (
        <View style={styles.expand}>
          <Text style={styles.expandLabel}>Role</Text>
          <View style={styles.roleBtns}>
            {['manager', 'cashier'].map((r) => {
              const active = person.role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, active && styles.roleBtnActive]}
                  onPress={() => onRoleChange(r)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.roleBtnText, active && styles.roleBtnTextActive]}
                  >
                    {ROLE_LABELS[r]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={onToggleActive}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleBtnText}>
              {person.isActive ? 'Deactivate account' : 'Reactivate account'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function AddStaffModal({ visible, onCancel, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('cashier');
    setSubmitting(false);
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      reset();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Failed to add', text2: err.message });
      setSubmitting(false);
    }
  };

  const canSubmit =
    name.trim() &&
    email.trim().length > 3 &&
    password.length >= 6 &&
    !submitting;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalSheetWrap}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add staff</Text>
              <TouchableOpacity onPress={handleCancel} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane Wanjiku"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={[styles.fieldLabel, styles.fieldSpacer]}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="jane@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={[styles.fieldLabel, styles.fieldSpacer]}>
              Temporary password (6+)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="••••••"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Text style={[styles.fieldLabel, styles.fieldSpacer]}>Role</Text>
            <View style={styles.roleBtns}>
              {['cashier', 'manager'].map((r) => {
                const active = role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleBtn, active && styles.roleBtnActive]}
                    onPress={() => setRole(r)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[styles.roleBtnText, active && styles.roleBtnTextActive]}
                    >
                      {ROLE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.modalSubmit, !canSubmit && styles.modalSubmitDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalSubmitText}>Add staff</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  listContent: {
    padding: spacing.screenPadding,
    paddingBottom: spacing.xxxl,
    flexGrow: 1,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  addBtnText: {
    ...typography.button,
    color: '#fff',
    fontSize: 15,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardInactive: { opacity: 0.6 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOff: { backgroundColor: colors.background },
  avatarText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowName: {
    ...typography.bodyMedium,
    color: colors.text,
    fontWeight: '600',
  },
  youTag: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '700',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  offTag: {
    ...typography.tiny,
    color: colors.danger,
    fontWeight: '700',
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.sm,
  },
  rowEmail: {
    ...typography.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  roleText: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  expand: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  expandLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  roleBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleBtnText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  roleBtnTextActive: { color: '#fff' },

  toggleBtn: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  toggleBtnText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySub: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheetWrap: { width: '100%' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text,
  },
  fieldLabel: {
    ...typography.tiny,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  fieldSpacer: { marginTop: spacing.md },
  input: {
    ...typography.bodyMedium,
    color: colors.text,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalSubmit: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.xl,
  },
  modalSubmitDisabled: { opacity: 0.4 },
  modalSubmitText: {
    ...typography.button,
    color: '#fff',
    fontSize: 17,
  },
});
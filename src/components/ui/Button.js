/**
 * <Button>
 *
 * Variants:
 *   primary    solid blue, white text   → primary actions
 *   secondary  soft blue bg, blue text  → secondary actions
 *   outline    transparent, blue border → tertiary
 *   danger     solid red, white text    → destructive
 *   ghost      transparent, blue text   → inline / low-emphasis
 *
 * Sizes: 'sm' | 'md' | 'lg'
 *
 * Props:
 *   title         {string}
 *   onPress       {function}
 *   variant       {string}
 *   size          {string}
 *   icon          {Ionicons name}
 *   iconPosition  {'left'|'right'}
 *   loading       {boolean}  Show spinner, disable tap
 *   disabled      {boolean}
 *   fullWidth     {boolean}  Default true
 */
import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, StyleSheet, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, radii, shadows } from '../../theme';

const VARIANTS = {
  primary:   { bg: colors.primary,     text: colors.textInverse, border: null },
  secondary: { bg: colors.primarySoft, text: colors.primary,     border: null },
  outline:   { bg: 'transparent',      text: colors.primary,     border: colors.primary },
  danger:    { bg: colors.danger,      text: colors.textInverse, border: null },
  ghost:     { bg: 'transparent',      text: colors.primary,     border: null },
};

const SIZES = {
  sm: { paddingV: 10, paddingH: spacing.lg, fontSize: 14 },
  md: { paddingV: spacing.lg, paddingH: spacing.xl, fontSize: 15 },
  lg: { paddingV: 18, paddingH: spacing.xxl, fontSize: 16 },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}) {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const inactive = loading || disabled;
  const iconSize = s.fontSize + 3;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border || 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
        },
        fullWidth && styles.fullWidth,
        inactive && styles.disabled,
        variant !== 'ghost' && variant !== 'outline' && shadows.sm,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {icon && iconPosition === 'left' && !loading ? (
          <Ionicons
            name={icon}
            size={iconSize}
            color={v.text}
            style={styles.iconLeft}
          />
        ) : null}

        {loading ? (
          <ActivityIndicator color={v.text} />
        ) : (
          <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>
            {title}
          </Text>
        )}

        {icon && iconPosition === 'right' && !loading ? (
          <Ionicons
            name={icon}
            size={iconSize}
            color={v.text}
            style={styles.iconRight}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.6 },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontWeight: '600' },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
});
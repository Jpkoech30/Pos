import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors, spacing, typography, radii, shadows } from '../theme';

const CATEGORY_META = {
  Coffee:          { icon: 'cafe-outline',       color: '#92400e', bg: '#fef3c7' },
  Grocery:         { icon: 'basket-outline',     color: '#065f46', bg: '#d1fae5' },
  Drinks:          { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Snacks:          { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  'Personal care': { icon: 'heart-outline',      color: '#9d174d', bg: '#fce7f3' },
  Household:       { icon: 'home-outline',       color: '#5b21b6', bg: '#ede9fe' },
  Pastry:          { icon: 'fast-food-outline',  color: '#9a3412', bg: '#ffedd5' },
  Sandwich:        { icon: 'restaurant-outline', color: '#065f46', bg: '#d1fae5' },
  Salad:           { icon: 'leaf-outline',       color: '#166534', bg: '#dcfce7' },
  Drink:           { icon: 'water-outline',      color: '#075985', bg: '#e0f2fe' },
  Other:           { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
  Default:         { icon: 'cube-outline',       color: colors.primary, bg: colors.primarySoft },
};

export default function ProductTile({ product, quantity = 0, onPress, onLongPress }) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.Default;
  const scale = useRef(new Animated.Value(1)).current;
  const inCart = quantity > 0;

  const animateTap = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    animateTap();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(product);
  };

  const handleLongPress = () => {
    if (!inCart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onLongPress?.(product);
  };

  return (
    <Animated.View style={[styles.tileWrap, { transform: [{ scale }] }]}>
      <TouchableOpacity
        style={[styles.tile, inCart && styles.tileActive]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={350}
        activeOpacity={0.9}
      >
        {inCart && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>×{quantity}</Text>
          </View>
        )}

        <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
          <Ionicons name={meta.icon} size={26} color={meta.color} />
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>KSh {Number(product.price).toFixed(0)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tileWrap: {
    margin: spacing.xs,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  tileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary,
    minWidth: 28,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    ...typography.tiny,
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  price: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
});
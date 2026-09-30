/**
 * <Screen>
 *
 * Standard wrapper for every screen. Handles:
 *   - Safe area (notch, status bar, home indicator)
 *   - Background color from theme
 *   - Optional horizontal padding
 *   - Optional scroll (for form screens)
 *
 * Props:
 *   scroll   {boolean}  Wrap children in a ScrollView
 *   padded   {boolean}  Apply screen padding (default true)
 *   edges    {array}    Which safe-area edges to respect
 *   style    {object}   Extra style for the inner container
 */
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export default function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  style,
}) {
  const innerStyle = [styles.fill, padded && styles.padded, style];

  return (
    <SafeAreaView style={styles.root} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={innerStyle}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={innerStyle}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flexGrow: 1 },
  padded: { padding: spacing.screenPadding },
});
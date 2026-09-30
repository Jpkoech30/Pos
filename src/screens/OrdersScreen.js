import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../components/ui';
import { colors, typography } from '../theme';

export default function OrdersScreen() {
  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Sales history will go here</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 8 },
});
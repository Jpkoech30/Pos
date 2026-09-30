import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { z } from 'zod';
import { productsApi } from '../services/products';
import { useForm } from '../hooks/useForm';
import FormInput from '../components/FormInput';
import { Screen, Card, Button, SectionLabel } from '../components/ui';
import { spacing } from '../theme';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) >= 0,
      'Price must be a valid non-negative number'
    ),
  category: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  barcode: z.string().trim().optional(),
  stock: z
    .string()
    .optional()
    .refine(
      (v) => v === undefined || v === '' || (!isNaN(Number(v)) && Number(v) >= 0),
      'Stock must be a non-negative number'
    ),
});

export default function ProductFormScreen({ route, navigation }) {
  const existing = route.params?.product;
  const isEdit = !!existing;

  const [loading, setLoading] = useState(false);

  const { values, errors, setField, handleSubmit } = useForm(schema, {
    name: existing?.name || '',
    price: existing?.price != null ? String(existing.price) : '',
    category: existing?.category || '',
    sku: existing?.sku || '',
    barcode: existing?.barcode || '',
    stock: existing?.stock != null ? String(existing.stock) : '',
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      setLoading(true);

      const payload = {
        name: v.name.trim(),
        price: Number(v.price),
        category: v.category?.trim() || 'Uncategorized',
        sku: v.sku?.trim() || null,
        barcode: v.barcode?.trim() || null,
        stock: v.stock === '' || v.stock === undefined ? 0 : Number(v.stock),
      };

      if (isEdit) {
        await productsApi.update(existing.id, payload);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        await productsApi.create(payload);
        Toast.show({ type: 'success', text1: 'Product created' });
      }

      navigation.goBack();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: isEdit ? 'Update failed' : 'Create failed',
        text2: err.message,
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll edges={['bottom']}>
        <SectionLabel>Basics</SectionLabel>
        <Card style={styles.group}>
          <FormInput
            label="Product Name"
            placeholder="e.g. Cappuccino"
            value={values.name}
            onChangeText={(t) => setField('name', t)}
            error={errors.name}
            editable={!loading}
          />
          <FormInput
            label="Price ($)"
            placeholder="0.00"
            value={values.price}
            onChangeText={(t) => setField('price', t)}
            error={errors.price}
            keyboardType="decimal-pad"
            editable={!loading}
          />
          <FormInput
            label="Category"
            placeholder="e.g. Coffee"
            value={values.category}
            onChangeText={(t) => setField('category', t)}
            error={errors.category}
            editable={!loading}
          />
        </Card>

        <SectionLabel>Inventory</SectionLabel>
        <Card style={styles.group}>
          <FormInput
            label="SKU"
            placeholder="e.g. COF-001"
            value={values.sku}
            onChangeText={(t) => setField('sku', t)}
            error={errors.sku}
            autoCapitalize="characters"
            editable={!loading}
          />
          <FormInput
            label="Barcode"
            placeholder="e.g. 5012345678900"
            value={values.barcode}
            onChangeText={(t) => setField('barcode', t)}
            error={errors.barcode}
            keyboardType="number-pad"
            editable={!loading}
          />
          <FormInput
            label="Stock"
            placeholder="0"
            value={values.stock}
            onChangeText={(t) => setField('stock', t)}
            error={errors.stock}
            keyboardType="number-pad"
            editable={!loading}
          />
        </Card>

        <View style={styles.footer}>
          <Button
            title={isEdit ? 'Save Changes' : 'Create Product'}
            onPress={onSubmit}
            loading={loading}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  group: {
    paddingBottom: spacing.xs,
    marginBottom: spacing.xxl,
  },
  footer: {
    marginTop: spacing.md,
  },
});
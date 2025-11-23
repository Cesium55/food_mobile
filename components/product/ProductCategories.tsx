import { Category } from '@/hooks/useCategories';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProductCategoriesProps {
  categories: Category[];
}

export default function ProductCategories({ categories }: ProductCategoriesProps) {
  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      {categories.map((category) => (
        <View key={category.id} style={styles.tag}>
          <Text style={styles.tagText}>{category.name}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  tagText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
  },
});


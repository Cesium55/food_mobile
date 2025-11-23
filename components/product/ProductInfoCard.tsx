import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProductInfoCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string | React.ReactNode;
}

export default function ProductInfoCard({ icon, iconColor, label, value }: ProductInfoCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <IconSymbol name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          {typeof value === 'string' ? (
            <Text style={styles.value}>{value}</Text>
          ) : (
            value
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});


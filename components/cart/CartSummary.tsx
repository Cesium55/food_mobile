import { StyleSheet, Text, View } from "react-native";

interface CartSummaryProps {
  totalItems: number;
  shopsCount: number;
  totalAmount: number;
}

export function CartSummary({ totalItems, shopsCount, totalAmount }: CartSummaryProps) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Товаров:</Text>
        <Text style={styles.summaryValue}>{totalItems} шт.</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Магазинов:</Text>
        <Text style={styles.summaryValue}>{shopsCount}</Text>
      </View>
      <View style={[styles.summaryRow, styles.summaryTotal]}>
        <Text style={styles.summaryTotalLabel}>Итого:</Text>
        <Text style={styles.summaryTotalValue}>{totalAmount.toFixed(2)} ₽</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 0,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
});


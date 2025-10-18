import { StyleSheet, Text, View } from "react-native";

export interface CharacteristicItem {
  key: string;
  value: string | number;
}

interface ProductCharacteristicsProps {
  characteristics: CharacteristicItem[];
}

export function ProductCharacteristics({ characteristics }: ProductCharacteristicsProps) {
  if (characteristics.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Характеристики</Text>
      <View style={styles.list}>
        {characteristics.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.row,
              index === characteristics.length - 1 && styles.lastRow
            ]}
          >
            <Text style={styles.key}>{item.key}</Text>
            <View style={styles.valueDots} />
            <Text style={styles.value}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  key: {
    fontSize: 15,
    color: '#666',
    flexShrink: 0,
  },
  valueDots: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    borderStyle: 'dotted',
    marginHorizontal: 8,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flexShrink: 0,
  },
});


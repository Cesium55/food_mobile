import { CartGroup } from "@/hooks/useCart";
import { StyleSheet, Text, View } from "react-native";
import { CartItem } from "./CartItem";
import { ItemStatusValidator } from "./types";

interface ShopGroupProps {
  group: CartGroup;
  statusValidators: ItemStatusValidator[];
  onIncrease: (itemId: number) => void;
  onDecrease: (itemId: number) => void;
  onRemove: (itemId: number) => void;
}

export function ShopGroup({ 
  group, 
  statusValidators, 
  onIncrease, 
  onDecrease, 
  onRemove 
}: ShopGroupProps) {
  return (
    <View style={styles.shopGroup}>
      {/* Заголовок магазина */}
      <View style={styles.shopHeader}>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName}>🏪 {group.shopName}</Text>
          <Text style={styles.shopAddress}>📍 {group.shopAddress}</Text>
        </View>
        <Text style={styles.shopTotal}>{group.total.toFixed(2)} ₽</Text>
      </View>

      {/* Товары */}
      {group.items.map((item) => {
        // Проверяем статус товара используя все валидаторы
        let itemStatus = { isInactive: false };
        for (const validator of statusValidators) {
          const status = validator(item);
          if (status.isInactive) {
            itemStatus = status;
            break;
          }
        }

        return (
          <CartItem
            key={item.id}
            item={item}
            status={itemStatus}
            onIncrease={onIncrease}
            onDecrease={onDecrease}
            onRemove={onRemove}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shopGroup: {
    marginBottom: 20,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 13,
    color: '#666',
  },
  shopTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 12,
  },
});


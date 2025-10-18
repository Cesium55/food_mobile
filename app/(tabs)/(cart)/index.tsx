import { TabScreen } from "@/components/TabScreen";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { ShopGroup } from "@/components/cart/ShopGroup";
import { expiredItemValidator } from "@/components/cart/types";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Cart() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const { 
    getCartByShops, 
    getTotalAmount, 
    getTotalItems, 
    getShopsCount,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
  } = useCart();
  
  const cartByShops = getCartByShops();
  const totalAmount = getTotalAmount();
  const totalItems = getTotalItems();
  const shopsCount = getShopsCount();

  // Список валидаторов для проверки статуса товаров
  // Можно легко добавить новые валидаторы в этот массив
  const statusValidators = [
    expiredItemValidator,
    // Здесь можно добавить другие валидаторы, например:
    // lowStockValidator,
    // unavailableItemValidator,
  ];

  if (cartByShops.length === 0) {
    return (
      <TabScreen title="Корзина">
        <EmptyCart />
      </TabScreen>
    );
  }

  // Расчет скидки
  const originalTotal = cartByShops.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => {
      return itemSum + (item.originalCost * item.quantity);
    }, 0);
  }, 0);
  const totalDiscount = originalTotal - totalAmount;
  
  // Итого к оплате
  const finalTotal = totalAmount;

  const handleCheckout = () => {
    router.push('/(tabs)/(cart)/checkout');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Корзина</Text>
      </View>

      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Общий чек */}
          <View style={styles.receiptSection}>
            <Text style={styles.receiptTitle}>Итого</Text>
            
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Товары ({totalItems} шт.)</Text>
              <Text style={styles.receiptValue}>{originalTotal.toFixed(2)} ₽</Text>
            </View>

            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, styles.discountText]}>Скидка</Text>
              <Text style={[styles.receiptValue, styles.discountText]}>
                -{totalDiscount.toFixed(2)} ₽
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <Text style={styles.totalLabel}>К оплате</Text>
              <Text style={styles.totalValue}>{finalTotal.toFixed(2)} ₽</Text>
            </View>
          </View>

          {/* Товары по магазинам */}
          {cartByShops.map((group) => (
            <ShopGroup
              key={group.shopId}
              group={group}
              statusValidators={statusValidators}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeItem}
            />
          ))}

          {/* Отступ для фиксированной кнопки */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Закрепленная кнопка оплаты */}
        <View style={styles.fixedBottomPanel}>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={handleCheckout}
            activeOpacity={0.7}
          >
            <View style={styles.checkoutButtonContent}>
              <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
              <Text style={styles.checkoutButtonAmount}>{finalTotal.toFixed(2)} ₽</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  receiptSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: '#666',
  },
  receiptValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  discountText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4CAF50',
  },
  bottomSpacer: {
    height: 100,
  },
  fixedBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  checkoutButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkoutButtonAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
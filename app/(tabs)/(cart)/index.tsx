import { TabScreen } from "@/components/TabScreen";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { ShopGroup } from "@/components/cart/ShopGroup";
import { expiredItemValidator } from "@/components/cart/types";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCart } from "@/hooks/useCart";
import { useOffers } from "@/hooks/useOffers";
import { createOrderFromCart, getCurrentPendingPurchase } from "@/services/orderService";
import { checkPaymentStatus } from "@/services/paymentService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_ID_STORAGE_KEY = '@current_payment_id';

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
    clearCart,
    isLoading,
    cartItems,
  } = useCart();
  
  const { getOfferById } = useOffers();
  
  // Состояние для проверки pending заказа
  const [isCheckingPending, setIsCheckingPending] = useState(true);
  // Состояние для создания заказа
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  // Состояние для проверки наличия pending заказа при загрузке
  const [isCheckingForPendingOrder, setIsCheckingForPendingOrder] = useState(true);
  
  // Функция для увеличения количества с проверкой максимального количества
  const handleIncrease = (itemId: number) => {
    const cartItem = cartItems.find(item => item.id === itemId);
    if (cartItem) {
      const offer = getOfferById(cartItem.offerId);
      if (offer) {
        increaseQuantity(itemId, offer.count);
      } else {
        increaseQuantity(itemId);
      }
    }
  };
  
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

  // Проверяем наличие pending заказа при загрузке компонента
  useEffect(() => {
    let isMounted = true;
    
    const checkPendingOrder = async () => {
      try {
        setIsCheckingForPendingOrder(true);
        
        // Проверяем наличие pending заказа
        const pendingOrder = await getCurrentPendingPurchase();
        
        if (isMounted && pendingOrder && pendingOrder.purchase && pendingOrder.purchase.id) {
          // Если есть pending заказ, автоматически перекидываем на экран оплаты в профиле
          router.replace({
            pathname: '/(tabs)/(profile)/checkout',
            params: {
              purchaseId: pendingOrder.purchase.id.toString(),
              orderData: JSON.stringify(pendingOrder),
            },
          });
          return;
        }
      } catch (error) {
      } finally {
        if (isMounted) setIsCheckingForPendingOrder(false);
      }
    };

    checkPendingOrder();

    return () => {
      isMounted = false;
    };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Проверяем статус платежа при загрузке компонента
  useEffect(() => {
    let isMounted = true;
    
    const checkPayment = async () => {
      try {
        setIsCheckingPending(true);
        
        const savedPaymentId = await AsyncStorage.getItem(PAYMENT_ID_STORAGE_KEY);
        if (!savedPaymentId) {
          if (isMounted) setIsCheckingPending(false);
          return;
        }

        const paymentId = parseInt(savedPaymentId);
        if (isNaN(paymentId)) {
          await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
          if (isMounted) setIsCheckingPending(false);
          return;
        }

        // Проверяем статус платежа
        const payment = await checkPaymentStatus(paymentId);
        
        if (payment.status === 'succeeded') {
          // Платеж успешен - очищаем корзину и paymentId
          await clearCart();
          await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
          if (isMounted) {
            Alert.alert(
              'Оплата успешна!',
              'Ваш заказ успешно оплачен. Товары удалены из корзины.',
              [{ text: 'OK' }]
            );
          }
        } else if (payment.status === 'canceled') {
          // Платеж отменен - очищаем paymentId
          await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
        }
      } catch (error) {
        // В случае ошибки очищаем сохраненный paymentId
        await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
      } finally {
        if (isMounted) setIsCheckingPending(false);
      }
    };

    checkPayment();

    return () => {
      isMounted = false;
    };
  }, []); // Пустой массив зависимостей - выполняется только при монтировании

  // Проверяем наличие pending заказа при фокусе на экране (когда пользователь возвращается)
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      
      const checkPendingOrder = async () => {
        if (isCancelled) return;
        
        try {
          // Проверяем наличие pending заказа
          const pendingOrder = await getCurrentPendingPurchase();
          
          if (!isCancelled && pendingOrder && pendingOrder.purchase && pendingOrder.purchase.id) {
            // Если есть pending заказ, автоматически перекидываем на экран оплаты в профиле
            router.replace({
              pathname: '/(tabs)/(profile)/checkout',
              params: {
                purchaseId: pendingOrder.purchase.id.toString(),
                orderData: JSON.stringify(pendingOrder),
              },
            });
            return;
          }
        } catch (error) {
          if (!isCancelled) {
          }
        }
      };

      checkPendingOrder();

      return () => {
        isCancelled = true;
      };
    }, [router])
  );

  // Проверяем статус платежа при фокусе на экране (когда пользователь возвращается)
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      
      const checkPayment = async () => {
        if (isCancelled) return;
        
        try {
          const savedPaymentId = await AsyncStorage.getItem(PAYMENT_ID_STORAGE_KEY);
          if (!savedPaymentId || isCancelled) {
            return;
          }

          const paymentId = parseInt(savedPaymentId);
          if (isNaN(paymentId)) {
            await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
            return;
          }

          // Проверяем статус платежа
          const payment = await checkPaymentStatus(paymentId);
          
          if (isCancelled) return;
          
          if (payment.status === 'succeeded') {
            // Платеж успешен - очищаем корзину и paymentId
            await clearCart();
            await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
            if (!isCancelled) {
              Alert.alert(
                'Оплата успешна!',
                'Ваш заказ успешно оплачен. Товары удалены из корзины.',
                [{ text: 'OK' }]
              );
            }
          } else if (payment.status === 'canceled') {
            // Платеж отменен - очищаем paymentId
            await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY);
          }
        } catch (error) {
          if (!isCancelled) {
            // В случае ошибки очищаем сохраненный paymentId
            await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
          }
        }
      };

      checkPayment();

      return () => {
        isCancelled = true;
      };
    }, [clearCart])
  );

  // Показываем индикатор загрузки во время проверки pending заказа, статуса платежа или загрузки корзины
  if (isCheckingForPendingOrder || isCheckingPending || isLoading) {
    return (
      <TabScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </TabScreen>
    );
  }

  if (cartByShops.length === 0) {
    return (
      <TabScreen>
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

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Ошибка', 'Корзина пуста');
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Сначала проверяем, есть ли уже pending платеж
      const existingPending = await getCurrentPendingPurchase();
      
      if (existingPending && existingPending.purchase && existingPending.purchase.id) {
        // Если есть pending платеж, открываем его в профиле вместо создания нового
        router.push({
          pathname: '/(tabs)/(profile)/checkout',
          params: {
            purchaseId: existingPending.purchase.id.toString(),
            orderData: JSON.stringify(existingPending),
          },
        });
        setIsCreatingOrder(false);
        return;
      }

      // Формируем запрос с оферами из корзины
      const offers = cartItems.map(item => ({
        offer_id: item.offerId,
        quantity: item.quantity,
      }));

      // Отправляем запрос на сервер
      const orderData = await createOrderFromCart(offers);

            // Переходим на экран checkout в профиле с данными заказа
            router.push({
              pathname: '/(tabs)/(profile)/checkout',
              params: {
                purchaseId: orderData.purchase.id.toString(),
                // Передаем данные через JSON строку (expo-router ограничения)
                orderData: JSON.stringify(orderData),
              },
            });
    } catch (error: any) {
      // Если получили 409, значит появился pending платеж - получаем его и открываем
      if (error.status === 409 || (error instanceof Error && error.message.includes('409'))) {
        try {
          const existingPending = await getCurrentPendingPurchase();
          if (existingPending && existingPending.purchase && existingPending.purchase.id) {
            router.push({
              pathname: '/(tabs)/(profile)/checkout',
              params: {
                purchaseId: existingPending.purchase.id.toString(),
                orderData: JSON.stringify(existingPending),
              },
            });
            setIsCreatingOrder(false);
            return;
          }
        } catch (fetchError) {
        }
      }
      
      Alert.alert(
        'Ошибка',
        error instanceof Error ? error.message : 'Не удалось создать заказ. Попробуйте еще раз.'
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Показываем загрузку пока проверяем pending заказ
  if (isCheckingForPendingOrder) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#EEEEEE' }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TabScreen>
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
              onIncrease={handleIncrease}
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
            style={[styles.checkoutButton, isCreatingOrder && styles.checkoutButtonDisabled]}
            onPress={handleCheckout}
            disabled={isCreatingOrder}
            activeOpacity={0.7}
          >
            <View style={styles.checkoutButtonContent}>
              {isCreatingOrder ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.checkoutButtonText}>Создание заказа...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
                  <Text style={styles.checkoutButtonAmount}>{finalTotal.toFixed(2)} ₽</Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  checkoutButtonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.7,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
});
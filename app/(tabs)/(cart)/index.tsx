import { TabScreen } from "@/components/TabScreen";
import { EmptyCart } from "@/components/cart/EmptyCart";
import { ShopGroup } from "@/components/cart/ShopGroup";
import { expiredItemValidator } from "@/components/cart/types";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCart } from "@/hooks/useCart";
import { useOffers } from "@/hooks/useOffers";
import { useShops } from "@/hooks/useShops";
import { useShopPoint } from "@/hooks/useShopPoints";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { createOrderFromCart, getCurrentPendingPurchase, getPurchaseById } from "@/services/orderService";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Компонент для получения адреса магазина и названия продавца
function ShopGroupWithAddress({ 
  group, 
  statusValidators, 
  selectedItems, 
  onIncrease, 
  onDecrease, 
  onRemove, 
  onToggleSelection,
  getShopById,
  getOfferById,
}: {
  group: {
    shopId: number;
    shopName: string;
    shopAddress: string;
    items: any[];
    total: number;
  };
  statusValidators: any[];
  selectedItems: Set<number>;
  onIncrease: (itemId: number) => void;
  onDecrease: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onToggleSelection?: (itemId: number) => void;
  getShopById: (id: number) => any;
  getOfferById: (id: number) => any;
}) {
  const { shopPoint } = useShopPoint(group.shopId);
  const shop = getShopById(group.shopId);
  
  // Получаем sellerId из всех товаров группы (из CartItem или из offer)
  // Пробуем найти валидный sellerId в любом товаре группы
  let sellerId: number | null = null;
  
  // Сначала пробуем получить из CartItem
  for (const item of group.items) {
    const itemSellerId = (item as any).sellerId;
    // Проверяем, что sellerId существует и является валидным числом (больше 0)
    if (itemSellerId && typeof itemSellerId === 'number' && itemSellerId > 0) {
      sellerId = itemSellerId;
      break;
    }
  }
  
  // Если не нашли в CartItem, пробуем получить из offer
  if (!sellerId) {
    for (const item of group.items) {
      const offer = getOfferById(item.offerId);
      const offerSellerId = offer?.sellerId;
      // Проверяем, что sellerId существует и является валидным числом (больше 0)
      if (offerSellerId && typeof offerSellerId === 'number' && offerSellerId > 0) {
        sellerId = offerSellerId;
        break;
      }
    }
  }
  
  const { seller } = usePublicSeller(sellerId);
  
  // Получаем название продавца вместо магазина
  // Используем название продавца, если оно загружено, иначе fallback на shopName
  const sellerName = seller?.short_name || seller?.full_name || group.shopName;
  
  // Получаем адрес из разных источников с приоритетом
  let shopAddress = shop?.address || shop?.fullName || shop?.name;
  
  // Если адреса нет в shop, пробуем получить из shopPoint
  if (!shopAddress && shopPoint) {
    shopAddress = shopPoint.address_formated || shopPoint.address_raw;
  }
  
  // Если все еще нет адреса, используем fallback
  shopAddress = shopAddress || group.shopAddress || 'Адрес не указан';
  
  return (
    <ShopGroup
      group={{ ...group, shopName: sellerName, shopAddress }}
      statusValidators={statusValidators}
      selectedItems={selectedItems}
      onIncrease={onIncrease}
      onDecrease={onDecrease}
      onRemove={onRemove}
      onToggleSelection={onToggleSelection}
    />
  );
}

export default function Cart() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const hasScrolledToTop = React.useRef(false);
  
  const { 
    getCartByShops, 
    getTotalAmount, 
    getTotalAmountSelected,
    getTotalItems, 
    getShopsCount,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    isLoading,
    cartItems,
    selectedItems,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    cacheOrder,
    getCachedOrder,
    clearCachedOrder,
    restoreItemsFromOrder,
  } = useCart();
  
  const { getOfferById } = useOffers();
  const { getShopById } = useShops();
  
  // Состояние для текущего заказа
  const [currentOrder, setCurrentOrder] = useState<{ id: number; total: number } | null>(null);
  const [isCheckingOrder, setIsCheckingOrder] = useState(true);
  // Состояние для создания заказа
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  // Ключ для полного пересоздания всего компонента корзины при каждом фокусе
  const [focusKey, setFocusKey] = useState(0);
  
  
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
  const totalAmountSelected = getTotalAmountSelected();
  const totalItems = getTotalItems();
  const shopsCount = getShopsCount();

  // Список валидаторов для проверки статуса товаров
  const statusValidators = [
    expiredItemValidator,
  ];

  // Проверяем наличие текущего заказа и кэшированного заказа при загрузке
  useEffect(() => {
    let isMounted = true;
    
    const checkOrders = async () => {
      try {
        setIsCheckingOrder(true);
        
        // Проверяем кэшированный заказ
        const cachedOrder = await getCachedOrder();
        if (cachedOrder) {
          // Проверяем статус заказа
          try {
            const purchase = await getPurchaseById(cachedOrder.purchaseId);
            
            if (purchase.status === 'cancelled') {
              // Заказ отменен - возвращаем товары в корзину
              await restoreItemsFromOrder(cachedOrder.reservedItems);
              await clearCachedOrder();
              if (isMounted) {
                setCurrentOrder(null);
              }
            } else if (purchase.status === 'paid' || purchase.status === 'confirmed' || purchase.status === 'completed') {
              // Заказ оплачен - очищаем кэш
              await clearCachedOrder();
              if (isMounted) {
                setCurrentOrder(null);
              }
            } else {
              // Заказ все еще pending - показываем его
              if (isMounted) {
                setCurrentOrder({
                  id: purchase.id,
                  total: parseFloat(purchase.total_cost),
                });
              }
            }
          } catch (error) {
            // Если заказ не найден, очищаем кэш
            await clearCachedOrder();
            if (isMounted) {
              setCurrentOrder(null);
            }
          }
        }
        
        // ВСЕГДА проверяем текущий pending заказ на сервере (даже если кэша нет)
        const pendingOrder = await getCurrentPendingPurchase();
        if (isMounted && pendingOrder && pendingOrder.purchase && pendingOrder.purchase.id) {
          // Не показываем отмененные заказы
          if (pendingOrder.purchase.status === 'cancelled') {
            // Если заказ отменен, очищаем кэш и не показываем его
            const cachedOrder = await getCachedOrder();
            if (cachedOrder && cachedOrder.purchaseId === pendingOrder.purchase.id) {
              await restoreItemsFromOrder(cachedOrder.reservedItems);
              await clearCachedOrder();
            }
            setCurrentOrder(null);
          } else {
            setCurrentOrder({
              id: pendingOrder.purchase.id,
              total: parseFloat(pendingOrder.purchase.total_cost),
            });
          }
        } else if (isMounted) {
          // Если нет pending заказа, очищаем состояние
          setCurrentOrder(null);
        }
      } catch (error) {
        // Игнорируем ошибки
      } finally {
        if (isMounted) setIsCheckingOrder(false);
      }
    };

    checkOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Проверяем наличие текущего заказа при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      
      // ПРИ КАЖДОМ ФОКУСЕ полностью пересоздаем компонент
      setFocusKey(prev => prev + 1);
      hasScrolledToTop.current = false;
      
      const checkOrders = async () => {
        if (isCancelled) return;
        
        try {
          // Сначала проверяем кэшированный заказ
          const cachedOrder = await getCachedOrder();
          if (cachedOrder) {
            try {
              const purchase = await getPurchaseById(cachedOrder.purchaseId);
              
              if (purchase.status === 'cancelled') {
                // Заказ отменен - возвращаем товары в корзину
                if (!isCancelled) {
                  await restoreItemsFromOrder(cachedOrder.reservedItems);
                  await clearCachedOrder();
                  setCurrentOrder(null);
                  // Прокручиваем вверх после восстановления товаров
                  setTimeout(() => {
                    if (!isCancelled && scrollViewRef.current) {
                      scrollViewRef.current.scrollTo({ y: 0, animated: false });
                    }
                  }, 300);
                }
                return;
              } else if (purchase.status === 'paid' || purchase.status === 'confirmed' || purchase.status === 'completed') {
                // Заказ оплачен - очищаем кэш
                if (!isCancelled) {
                  await clearCachedOrder();
                  setCurrentOrder(null);
                }
                return;
              } else {
                // Заказ все еще pending - показываем его
                if (!isCancelled) {
                  setCurrentOrder({
                    id: purchase.id,
                    total: parseFloat(purchase.total_cost),
                  });
                }
                return;
              }
            } catch (error) {
              // Если заказ не найден, очищаем кэш
              if (!isCancelled) {
                await clearCachedOrder();
                setCurrentOrder(null);
              }
            }
          }
          
          // ВСЕГДА проверяем текущий pending заказ на сервере (даже если кэша нет)
          const pendingOrder = await getCurrentPendingPurchase();
          
          if (!isCancelled && pendingOrder && pendingOrder.purchase && pendingOrder.purchase.id) {
            // Не показываем отмененные заказы
            if (pendingOrder.purchase.status === 'cancelled') {
              // Если заказ отменен, очищаем кэш и не показываем его
              const cachedOrder = await getCachedOrder();
              if (cachedOrder && cachedOrder.purchaseId === pendingOrder.purchase.id) {
                await restoreItemsFromOrder(cachedOrder.reservedItems);
                await clearCachedOrder();
              }
              setCurrentOrder(null);
            } else {
              setCurrentOrder({
                id: pendingOrder.purchase.id,
                total: parseFloat(pendingOrder.purchase.total_cost),
              });
            }
          } else if (!isCancelled) {
            // Если нет pending заказа, очищаем состояние
            setCurrentOrder(null);
          }
        } catch (error) {
          // Игнорируем ошибки
        }
      };

      checkOrders();

      return () => {
        isCancelled = true;
      };
    }, [restoreItemsFromOrder, clearCachedOrder, getCachedOrder])
  );

  // Показываем индикатор загрузки во время проверки заказа или загрузки корзины
  if (isCheckingOrder || isLoading) {
    return (
      <TabScreen>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </TabScreen>
    );
  }

  // Расчет скидки для выбранных товаров
  const selectedCartItems = cartItems.filter(item => selectedItems.has(item.id));
  const originalTotalSelected = selectedCartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.originalCost) * item.quantity);
  }, 0);
  const totalDiscountSelected = originalTotalSelected - totalAmountSelected;
  
  // Итого к оплате (только выбранные товары)
  const finalTotal = totalAmountSelected;

  const handleCheckout = async () => {
    if (selectedCartItems.length === 0) {
      Alert.alert('Ошибка', 'Выберите товары для покупки');
      return;
    }

    if (currentOrder) {
      Alert.alert('Внимание', 'У вас уже есть текущий заказ. Сначала завершите его оплату.');
      return;
    }

    setIsCreatingOrder(true);
    try {
      // Формируем запрос с оферами только из выбранных товаров
      const offers = selectedCartItems.map(item => ({
        offer_id: item.offerId,
        quantity: item.quantity,
      }));

      // Отправляем запрос на сервер
      const orderData = await createOrderFromCart(offers);

      // Кэшируем заказ и изымаем товары из корзины
      await cacheOrder(orderData.purchase.id, selectedCartItems);

      // Обновляем состояние текущего заказа
      setCurrentOrder({
        id: orderData.purchase.id,
        total: parseFloat(orderData.purchase.total_cost),
      });

      // Не пересоздаем компонент перед переходом - просто переходим

      // Переходим на экран checkout в профиле с данными заказа
      router.push({
        pathname: '/(tabs)/(profile)/checkout',
        params: {
          purchaseId: orderData.purchase.id.toString(),
          orderData: JSON.stringify(orderData),
        },
      });
    } catch (error: any) {
      // Если получили 409, значит появился pending платеж - получаем его и открываем
      if (error.status === 409 || (error instanceof Error && error.message.includes('409'))) {
        try {
          const existingPending = await getCurrentPendingPurchase();
          if (existingPending && existingPending.purchase && existingPending.purchase.id) {
            setCurrentOrder({
              id: existingPending.purchase.id,
              total: parseFloat(existingPending.purchase.total_cost),
            });
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
          // Игнорируем ошибки
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

  const handleViewOrder = () => {
    if (currentOrder) {
      router.push({
        pathname: '/(tabs)/(profile)/checkout',
        params: {
          purchaseId: currentOrder.id.toString(),
        },
      });
    }
  };

  // Если корзина пустая, показываем простой View без ScrollView
  if (cartItems.length === 0 && !currentOrder) {
    return (
      <TabScreen>
        <EmptyCart />
      </TabScreen>
    );
  }

  return (
    <TabScreen key={`tab-${focusKey}`}>
      <View key={`container-${focusKey}`} style={styles.container}>
        <ScrollView 
          key={`scroll-${focusKey}`}
          ref={scrollViewRef}
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Плашка с текущим заказом */}
          {currentOrder && (
            <View style={styles.currentOrderBanner}>
              <View style={styles.currentOrderContent}>
                <Text style={styles.currentOrderTitle}>Текущий заказ</Text>
                <Text style={styles.currentOrderText}>
                  Заказ #{currentOrder.id} на сумму {currentOrder.total.toFixed(2)} ₽
                </Text>
              </View>
              <TouchableOpacity
                style={styles.viewOrderButton}
                onPress={handleViewOrder}
                activeOpacity={0.7}
              >
                <Text style={styles.viewOrderButtonText}>Перейти к оплате</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Общий чек (только для выбранных товаров) */}
          {selectedCartItems.length > 0 && (
            <View style={styles.receiptSection}>
              <Text style={styles.receiptTitle}>Итого (выбрано {selectedCartItems.reduce((sum, item) => sum + item.quantity, 0)} шт.)</Text>
              
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Товары</Text>
                <Text style={styles.receiptValue}>{originalTotalSelected.toFixed(2)} ₽</Text>
              </View>

              {totalDiscountSelected > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, styles.discountText]}>Скидка</Text>
                  <Text style={[styles.receiptValue, styles.discountText]}>
                    -{totalDiscountSelected.toFixed(2)} ₽
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.receiptRow}>
                <Text style={styles.totalLabel}>К оплате</Text>
                <Text style={styles.totalValue}>{finalTotal.toFixed(2)} ₽</Text>
              </View>
            </View>
          )}

          {/* Товары по магазинам */}
          {cartByShops.map((group) => (
            <ShopGroupWithAddress
              key={group.shopId}
              group={group}
              statusValidators={statusValidators}
              selectedItems={selectedItems}
              onIncrease={handleIncrease}
              onDecrease={decreaseQuantity}
              onRemove={removeItem}
              onToggleSelection={toggleItemSelection}
              getShopById={getShopById}
              getOfferById={getOfferById}
            />
          ))}

          {/* Отступ для фиксированной кнопки */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Закрепленная кнопка оплаты */}
        {selectedCartItems.length > 0 && (
          <View style={styles.fixedBottomPanel}>
            <TouchableOpacity
              style={[styles.checkoutButton, (isCreatingOrder || currentOrder) && styles.checkoutButtonDisabled]}
              onPress={handleCheckout}
              disabled={isCreatingOrder || !!currentOrder}
              activeOpacity={0.7}
            >
              <View style={styles.checkoutButtonContent}>
                {isCreatingOrder ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.checkoutButtonText}>Создание заказа...</Text>
                  </>
                ) : currentOrder ? (
                  <Text style={styles.checkoutButtonText}>Завершите текущий заказ</Text>
                ) : (
                  <>
                    <Text style={styles.checkoutButtonText}>Оформить заказ</Text>
                    <Text style={styles.checkoutButtonAmount}>{finalTotal.toFixed(2)} ₽</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
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
    paddingBottom: 16,
  },
  scrollContentEmpty: {
    flexGrow: 1,
    minHeight: '100%',
  },
  currentOrderBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  currentOrderContent: {
    flex: 1,
  },
  currentOrderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  currentOrderText: {
    fontSize: 14,
    color: '#F57C00',
  },
  viewOrderButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  viewOrderButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptSection: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
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
});

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCart } from "@/hooks/useCart";
import { Order, useOrders } from "@/hooks/useOrders";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type PaymentMethod = 'card' | 'cash' | 'online';

interface ItemStatus {
  status: 'available' | 'unavailable' | 'expired';
  message?: string;
}

interface CheckoutItem {
  id: number;
  productName: string;
  quantity: number;
  currentCost: number;
  originalCost: number;
  expiresDate: Date;
}

interface ShopGroup {
  shopId: number;
  shopName: string;
  items: CheckoutItem[];
}

export default function CheckoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  
  const { cartItems, getCartByShops: getCartByShopsFromCart } = useCart();
  const { getOrderById } = useOrders();
  
  // Определяем, работаем ли с существующим заказом или с корзиной
  const existingOrder: Order | undefined = params.orderId ? getOrderById(Number(params.orderId)) : undefined;
  const isExistingOrder = !!existingOrder;

  // Преобразуем данные заказа в формат для отображения
  const orderShopGroups: ShopGroup[] = useMemo(() => {
    if (!existingOrder) return [];
    
    const groupedByShop = new Map<string, CheckoutItem[]>();
    
    existingOrder.items.forEach((item) => {
      const shopName = item.shopName;
      if (!groupedByShop.has(shopName)) {
        groupedByShop.set(shopName, []);
      }
      
      groupedByShop.get(shopName)!.push({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        currentCost: item.price,
        originalCost: item.price,
        expiresDate: new Date(Date.now() + 86400000), // Заглушка: +1 день
      });
    });
    
    return Array.from(groupedByShop.entries()).map(([shopName], index) => ({
      shopId: index + 1,
      shopName,
      items: groupedByShop.get(shopName)!,
    }));
  }, [existingOrder]);

  const initialTimeLeft = existingOrder?.timeLeft ? existingOrder.timeLeft * 60 : 300; // Конвертируем минуты в секунды
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>(
    existingOrder?.paymentMethod || 'card'
  );
  
  // Симуляция проверки статусов товаров
  const [itemStatuses, setItemStatuses] = useState<Map<number, ItemStatus>>(new Map());

  // Таймер (только для заказов со статусом reserved или для новых заказов)
  useEffect(() => {
    if (existingOrder && existingOrder.status !== 'reserved') {
      return; // Таймер не нужен для оплаченных/завершенных заказов
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          Alert.alert(
            'Время истекло',
            'Время бронирования истекло. Пожалуйста, оформите заказ заново.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [existingOrder]);

  // Проверка статусов при загрузке (бронирование)
  // После этого статусы не меняются в течение 5 минут
  useEffect(() => {
    const statuses = new Map<number, ItemStatus>();
    
    const itemsToCheck = isExistingOrder 
      ? orderShopGroups.flatMap(group => group.items)
      : cartItems;
    
    itemsToCheck.forEach((item) => {
      // Для существующих оплаченных/завершенных заказов все товары доступны
      if (existingOrder && (existingOrder.status === 'paid' || existingOrder.status === 'completed')) {
        statuses.set(item.id, { status: 'available' });
        return;
      }
      
      // Проверка срока годности
      const now = new Date();
      const expiryDate = new Date(item.expiresDate);
      
      if (expiryDate.getTime() < now.getTime()) {
        statuses.set(item.id, {
          status: 'expired',
          message: 'Товар просрочен',
        });
      } 
      // Симуляция: некоторые товары могут быть недоступны на момент бронирования
      // (только для новых заказов из корзины)
      else if (!isExistingOrder && Math.random() < 0.25) { // 25% шанс что товар недоступен
        statuses.set(item.id, {
          status: 'unavailable',
          message: 'Товар больше не доступен',
        });
      }
      else {
        statuses.set(item.id, {
          status: 'available',
        });
      }
    });

    setItemStatuses(statuses);
  }, [isExistingOrder, existingOrder]);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Расчеты
  const cartByShops = isExistingOrder ? orderShopGroups : getCartByShopsFromCart();
  
  const originalTotal = cartByShops.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => {
      const status = itemStatuses.get(item.id);
      if (status?.status === 'available') {
        return itemSum + (item.originalCost * item.quantity);
      }
      return itemSum;
    }, 0);
  }, 0);

  const availableTotal = cartByShops.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => {
      const status = itemStatuses.get(item.id);
      if (status?.status === 'available') {
        return itemSum + (item.currentCost * item.quantity);
      }
      return itemSum;
    }, 0);
  }, 0);

  const totalDiscount = originalTotal - availableTotal;

  // Количество доступных товаров
  const allItems = isExistingOrder 
    ? orderShopGroups.flatMap(group => group.items)
    : cartItems;
  
  const availableItemsCount = allItems.filter(item => 
    itemStatuses.get(item.id)?.status === 'available'
  ).reduce((sum, item) => sum + item.quantity, 0);

  const handlePayment = () => {
    if (availableItemsCount === 0) {
      Alert.alert('Ошибка', 'Нет доступных товаров для оплаты');
      return;
    }

    Alert.alert(
      'Оплата',
      `Оплата ${availableTotal.toFixed(2)} ₽ через ${
        selectedPayment === 'card' ? 'карту' : 
        selectedPayment === 'cash' ? 'наличные' : 
        'онлайн-кошелек'
      }`,
      [{ text: 'OK', onPress: () => {
        Alert.alert('Успешно', 'Заказ оплачен!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } }]
    );
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Отмена заказа',
      'Вы уверены, что хотите отменить заказ?',
      [
        { text: 'Нет', style: 'cancel' },
        { text: 'Да, отменить', style: 'destructive', onPress: () => {
          Alert.alert('Отменено', 'Заказ отменен', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }},
      ]
    );
  };

  const getHeaderTitle = () => {
    if (!existingOrder) return 'Оформление заказа';
    
    switch (existingOrder.status) {
      case 'reserved':
        return `Заказ #${existingOrder.id} (Забронирован)`;
      case 'paid':
        return `Заказ #${existingOrder.id} (Оплачен)`;
      case 'completed':
        return `Заказ #${existingOrder.id} (Выполнен)`;
      case 'cancelled':
        return `Заказ #${existingOrder.id} (Отменен)`;
      default:
        return `Заказ #${existingOrder.id}`;
    }
  };

  const getItemStatusStyle = (status: ItemStatus) => {
    switch (status.status) {
      case 'expired':
        return { bg: '#FFEBEE', text: '#F44336', border: '#F44336' };
      case 'unavailable':
        return { bg: '#FFF3E0', text: '#FF9800', border: '#FF9800' };
      default:
        return { bg: '#E8F5E9', text: '#4CAF50', border: '#4CAF50' };
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {getHeaderTitle()}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Таймер (только для забронированных или новых заказов) */}
          {(!existingOrder || existingOrder.status === 'reserved') && (
            <View style={[styles.timerSection, timeLeft < 60 && styles.timerWarning]}>
              <Text style={styles.timerLabel}>Время бронирования:</Text>
              <Text style={[styles.timerText, timeLeft < 60 && styles.timerTextWarning]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}

          {/* QR-код для оплаченных заказов */}
          {existingOrder?.status === 'paid' && (
            <View style={styles.qrSection}>
              <Text style={styles.sectionTitle}>QR-код для получения</Text>
              <View style={styles.qrCodeContainer}>
                <View style={styles.qrCodePlaceholder}>
                  <Text style={styles.qrCodeText}>QR</Text>
                  <Text style={styles.qrCodeSubtext}>#{existingOrder.id}</Text>
                </View>
                <Text style={styles.qrInstruction}>
                  Покажите этот код при получении заказа
                </Text>
              </View>
            </View>
          )}

          {/* Список товаров */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Товары в заказе</Text>
            
            {cartByShops.map((group) => (
              <View key={group.shopId} style={styles.shopSection}>
                <Text style={styles.shopName}>🏪 {group.shopName}</Text>
                
                {group.items.map((item) => {
                  const status = itemStatuses.get(item.id) || { status: 'available' };
                  const statusStyle = getItemStatusStyle(status);
                  const isAvailable = status.status === 'available';

                  return (
                    <View 
                      key={item.id} 
                      style={[
                        styles.itemCard,
                        !isAvailable && styles.itemCardDisabled,
                        { borderLeftColor: statusStyle.border }
                      ]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, !isAvailable && styles.itemNameDisabled]}>
                          {item.productName}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity} шт. × {item.currentCost.toFixed(2)} ₽
                        </Text>
                      </View>

                      <View style={styles.itemRight}>
                        {status.status !== 'available' && (
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                              {status.message}
                            </Text>
                          </View>
                        )}
                        <Text style={[
                          styles.itemTotal,
                          !isAvailable && styles.itemTotalDisabled
                        ]}>
                          {isAvailable 
                            ? `${(item.currentCost * item.quantity).toFixed(2)} ₽`
                            : '—'
                          }
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Способ оплаты */}
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Способ оплаты</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === 'card' && styles.paymentOptionSelected
              ]}
              onPress={() => setSelectedPayment('card')}
              disabled={existingOrder?.status === 'paid' || existingOrder?.status === 'completed' || existingOrder?.status === 'cancelled'}
            >
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentIcon}>💳</Text>
                <View>
                  <Text style={styles.paymentTitle}>Банковская карта</Text>
                  <Text style={styles.paymentSubtitle}>Visa, MasterCard, МИР</Text>
                </View>
              </View>
              {selectedPayment === 'card' && (
                <View style={styles.selectedMark}>
                  <Text style={styles.selectedMarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === 'cash' && styles.paymentOptionSelected
              ]}
              onPress={() => setSelectedPayment('cash')}
              disabled={existingOrder?.status === 'paid' || existingOrder?.status === 'completed' || existingOrder?.status === 'cancelled'}
            >
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentIcon}>💵</Text>
                <View>
                  <Text style={styles.paymentTitle}>Наличные</Text>
                  <Text style={styles.paymentSubtitle}>Оплата при получении</Text>
                </View>
              </View>
              {selectedPayment === 'cash' && (
                <View style={styles.selectedMark}>
                  <Text style={styles.selectedMarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentOption,
                selectedPayment === 'online' && styles.paymentOptionSelected
              ]}
              onPress={() => setSelectedPayment('online')}
              disabled={existingOrder?.status === 'paid' || existingOrder?.status === 'completed' || existingOrder?.status === 'cancelled'}
            >
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentIcon}>📱</Text>
                <View>
                  <Text style={styles.paymentTitle}>Электронный кошелек</Text>
                  <Text style={styles.paymentSubtitle}>ЮMoney, QIWI, WebMoney</Text>
                </View>
              </View>
              {selectedPayment === 'online' && (
                <View style={styles.selectedMark}>
                  <Text style={styles.selectedMarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Итого */}
          <View style={styles.totalSection}>
            <Text style={styles.sectionTitle}>Итого</Text>
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Доступно товаров:</Text>
              <Text style={styles.totalValue}>{availableItemsCount} шт.</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Сумма:</Text>
              <Text style={styles.totalValue}>{originalTotal.toFixed(2)} ₽</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountText]}>Скидка:</Text>
              <Text style={[styles.totalValue, styles.discountText]}>
                -{totalDiscount.toFixed(2)} ₽
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.finalLabel}>К оплате:</Text>
              <Text style={styles.finalValue}>{availableTotal.toFixed(2)} ₽</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Кнопки действий */}
        {(!existingOrder || existingOrder.status === 'reserved') && (
          <View style={styles.fixedBottomPanel}>
            {existingOrder?.status === 'reserved' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelOrder}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Отменить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                existingOrder?.status === 'reserved' ? styles.payButtonHalf : styles.payButton,
                availableItemsCount === 0 && styles.payButtonDisabled
              ]}
              onPress={handlePayment}
              disabled={availableItemsCount === 0}
              activeOpacity={0.7}
            >
              <View style={styles.payButtonContent}>
                <Text style={styles.payButtonText}>
                  {availableItemsCount === 0 ? 'Нет доступных товаров' : 'Оплатить'}
                </Text>
                {availableItemsCount > 0 && (
                  <Text style={styles.payButtonAmount}>{availableTotal.toFixed(2)} ₽</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
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
  timerSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerWarning: {
    backgroundColor: '#FFEBEE',
  },
  timerLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  timerTextWarning: {
    color: '#F44336',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  itemsSection: {
    marginBottom: 16,
  },
  shopSection: {
    marginBottom: 16,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemCardDisabled: {
    opacity: 0.6,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemNameDisabled: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  itemTotalDisabled: {
    color: '#999',
  },
  paymentSection: {
    marginBottom: 16,
  },
  paymentOption: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  paymentOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    fontSize: 32,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedMark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  totalSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
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
  finalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  finalValue: {
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
    flexDirection: 'row',
    gap: 12,
  },
  payButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  payButtonHalf: {
    flex: 2,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  payButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  payButtonAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  qrSection: {
    marginBottom: 16,
  },
  qrCodeContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodeText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#2196F3',
  },
  qrCodeSubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  qrInstruction: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});


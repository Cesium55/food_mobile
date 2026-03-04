import { ScreenWrapper } from "@/components/screen/ScreenWrapper";
import { useOrders } from "@/hooks/useOrders";
import { useOffers } from "@/hooks/useOffers";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function History() {
  const router = useRouter();
  const { orders, getTotalSpent, getTotalSaved, loading, refetchOrders } = useOrders();
  const { refetch: refetchOffers } = useOffers();

  // Загружаем офферы при монтировании, чтобы товары в заказах отображались правильно
  useEffect(() => {
    refetchOffers({ skipExpiredFilter: true });
  }, [refetchOffers]);

  const formatDate = (date: Date) => {
    // Если date - это строка ISO (UTC), создаем Date объект
    // JavaScript автоматически конвертирует UTC в местное время
    const d = date instanceof Date ? date : new Date(date);
    
    // Используем методы getDate(), getHours() и т.д., которые возвращают значения в местном времени
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // Зеленый
      case 'confirmed':
        return '#2196F3'; // Синий
      case 'cancelled':
        return '#F44336';
      case 'processing':
        return '#FF9800';
      case 'reserved':
        return '#FF9800';
      case 'paid':
        return '#2196F3';
      default:
        return '#999';
    }
  };

  const totalSpent = getTotalSpent();
  const totalSaved = getTotalSaved();

  // Обновляем заказы при фокусе на экране
  useFocusEffect(
    useCallback(() => {
      refetchOrders();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <ScreenWrapper 
      title="История заказов"
      onRefresh={refetchOrders}
      refreshing={loading}
    >
      <View style={styles.container}>
        {/* Статистика */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Всего потрачено</Text>
            <Text style={styles.statValue}>{totalSpent.toFixed(2)} ₽</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Сэкономлено</Text>
            <Text style={[styles.statValue, styles.statValueSaved]}>
              {totalSaved.toFixed(2)} ₽
            </Text>
          </View>
        </View>

        {/* Список заказов */}
        {loading && orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.emptyText}>Загрузка заказов...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Заказов пока нет</Text>
            <Text style={styles.emptySubtext}>
              Оформите первый заказ и он появится здесь
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusColor = getStatusColor(order.status);
            return (
              <TouchableOpacity
                key={order.id}
                style={[styles.orderCard, { borderLeftWidth: 4, borderLeftColor: statusColor }]}
                activeOpacity={0.7}
                onPress={() => {
                  // Если заказ отменен, показываем его на экране просмотра (но без QR и платежа)
                  if (order.status === 'cancelled') {
                    router.push({
                      pathname: '/(tabs)/(profile)/order-paid',
                      params: {
                        purchaseId: order.id.toString(),
                      },
                    });
                    return;
                  }
                  
                  // Если заказ оплачен, подтвержден или завершен, переходим на экран оплаченного заказа
                  if (order.status === 'paid' || order.status === 'completed') {
                    router.push({
                      pathname: '/(tabs)/(profile)/order-paid',
                      params: {
                        purchaseId: order.id.toString(),
                      },
                    });
                  } else {
                    // Иначе на экран оплаты (только для reserved/pending)
                    router.push({
                      pathname: '/(tabs)/(profile)/checkout',
                      params: {
                        purchaseId: order.id.toString(),
                      },
                    });
                  }
                }}
              >
                {/* Информация о заказе */}
                <View style={styles.orderHeader}>
                  <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                  <Text style={styles.totalAmount}>
                    {order.totalAmount.toFixed(2)} ₽
                  </Text>
                </View>
                
                {/* Список товаров */}
                {order.items && order.items.length > 0 && (
                  <View style={styles.itemsContainer}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <View key={item.id} style={styles.itemRow}>
                        <View style={styles.itemMain}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.productName}
                          </Text>
                          {item.refundedQuantity > 0 ? (
                            <Text style={styles.refundBadge}>
                              {item.refundedQuantity >= item.quantity
                                ? `Полный возврат (${item.refundedQuantity} шт.)`
                                : `Частичный возврат (${item.refundedQuantity} шт.)`}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text style={styles.moreItems}>
                        и еще {order.items.length - 3} товар{order.items.length - 3 > 1 ? 'ов' : ''}
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 20,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statValueSaved: {
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  itemsContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemMain: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    color: '#666',
  },
  refundBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B00020',
    marginTop: 2,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  moreItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
});


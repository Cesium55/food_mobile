import { Order } from "@/hooks/useOrders";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface CurrentOrdersProps {
  orders: Order[];
}

export function CurrentOrders({ orders }: CurrentOrdersProps) {
  const router = useRouter();
  const formatTime = (minutes: number) => {
    return `${minutes} мин.`;
  };

  const formatDateTime = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

  const getStatusInfo = (status: string, timeLeft?: number) => {
    switch (status) {
      case 'reserved':
        return {
          text: timeLeft ? `Забронирован (${formatTime(timeLeft)})` : 'Забронирован',
          color: '#FF9800',
          bg: '#FFF3E0',
        };
      case 'paid':
        return {
          text: 'Оплачен',
          color: '#2196F3',
          bg: '#E3F2FD',
        };
      default:
        return {
          text: 'В обработке',
          color: '#999',
          bg: '#F5F5F5',
        };
    }
  };

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Нет текущих заказов</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Текущие заказы</Text>
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.status, order.timeLeft);
        return (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard} 
            activeOpacity={0.7}
            onPress={() => {
              // Если заказ оплачен, переходим на экран оплаченного заказа
              if (order.status === 'paid' || order.status === 'completed') {
                router.push({
                  pathname: '/(tabs)/(profile)/order-paid',
                  params: {
                    purchaseId: order.id.toString(),
                  },
                });
              } else {
                // Иначе на экран оплаты
                router.push({
                  pathname: '/(tabs)/(profile)/checkout',
                  params: {
                    purchaseId: order.id.toString(),
                  },
                });
              }
            }}
          >
            <View style={styles.orderHeader}>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNumber}>Заказ #{order.id}</Text>
                <Text style={styles.dateTime}>
                  {formatDateTime(order.date)}
                </Text>
                <Text style={styles.shopsList}>
                  {order.shops.join(', ')}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.text}
                </Text>
              </View>
            </View>

            <View style={styles.itemsList}>
              {order.items.slice(0, 2).map((item) => (
                <Text key={item.id} style={styles.itemText} numberOfLines={1}>
                  • {item.productName} ({item.quantity} шт.)
                </Text>
              ))}
              {order.items.length > 2 && (
                <Text style={styles.moreItems}>
                  и еще {order.items.length - 2} товар(а/ов)
                </Text>
              )}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalLabel}>Итого:</Text>
              <Text style={styles.totalAmount}>{order.totalAmount.toFixed(2)} ₽</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  shopsList: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  itemsList: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
});


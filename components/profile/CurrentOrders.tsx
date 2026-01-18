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
    return `${day}.${month}.${year} ${hours}:${minutes}`;
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
      case 'confirmed':
        return {
          text: 'Подтвержден',
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
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Текущие заказы</Text>
      {orders.map((order, index) => {
        const statusInfo = getStatusInfo(order.status, order.timeLeft);
        const isLast = index === orders.length - 1;
        return (
          <View key={order.id}>
            <TouchableOpacity 
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
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.text}
                  </Text>
                </View>
              </View>

              <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Итого:</Text>
                <Text style={styles.totalAmount}>{order.totalAmount.toFixed(2)} ₽</Text>
              </View>
            </TouchableOpacity>
            {!isLast && <View style={styles.divider} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  orderCard: {
    backgroundColor: 'transparent',
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  orderFooter: {
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


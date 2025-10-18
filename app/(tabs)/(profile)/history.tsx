import { TabScreen } from "@/components/TabScreen";
import { useOrders } from "@/hooks/useOrders";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function History() {
  const router = useRouter();
  const { orders, getTotalSpent, getTotalSaved } = useOrders();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { text: 'Выполнен', color: '#4CAF50', bg: '#E8F5E9' };
      case 'cancelled':
        return { text: 'Отменен', color: '#F44336', bg: '#FFEBEE' };
      case 'processing':
        return { text: 'В обработке', color: '#FF9800', bg: '#FFF3E0' };
      case 'reserved':
        return { text: 'Забронирован', color: '#FF9800', bg: '#FFF3E0' };
      case 'paid':
        return { text: 'Оплачен', color: '#2196F3', bg: '#E3F2FD' };
      default:
        return { text: 'Неизвестно', color: '#999', bg: '#F5F5F5' };
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'card':
        return '💳 Карта';
      case 'cash':
        return '💵 Наличные';
      case 'online':
        return '📱 Онлайн';
      default:
        return method;
    }
  };

  const totalSpent = getTotalSpent();
  const totalSaved = getTotalSaved();

  return (
    <TabScreen title="История заказов" showBackButton={true}>
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
        <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>Заказов пока нет</Text>
              <Text style={styles.emptySubtext}>
                Оформите первый заказ и он появится здесь
              </Text>
            </View>
          ) : (
            orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(tabs)/(profile)/checkout?orderId=${order.id}`)}
                >
                  {/* Заголовок заказа */}
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <Text style={styles.orderNumber}>Заказ #{order.id}</Text>
                      <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
                    </View>
                    <View
                      style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}
                    >
                      <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                      </Text>
                    </View>
                  </View>

                  {/* Магазины */}
                  <View style={styles.shopsRow}>
                    <Text style={styles.shopsLabel}>🏪 Магазины:</Text>
                    <Text style={styles.shopsText}>
                      {order.shops.join(', ')}
                    </Text>
                  </View>

                  {/* Товары */}
                  <View style={styles.itemsSection}>
                    {order.items.slice(0, 3).map((item, index) => (
                      <View key={item.id} style={styles.itemRow}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.productName}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity} шт.
                        </Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <Text style={styles.moreItems}>
                        и еще {order.items.length - 3} товар(а/ов)
                      </Text>
                    )}
                  </View>

                  {/* Итого */}
                  <View style={styles.orderFooter}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentMethod}>
                        {getPaymentMethodText(order.paymentMethod)}
                      </Text>
                      {order.discount > 0 && (
                        <Text style={styles.discount}>
                          Скидка: {order.discount.toFixed(2)} ₽
                        </Text>
                      )}
                    </View>
                    <View style={styles.totalSection}>
                      <Text style={styles.totalLabel}>Итого:</Text>
                      <Text style={styles.totalAmount}>
                        {order.totalAmount.toFixed(2)} ₽
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  ordersList: {
    flex: 1,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shopsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  shopsLabel: {
    fontSize: 13,
    color: '#666',
  },
  shopsText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
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
  paymentInfo: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  discount: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  totalSection: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
});

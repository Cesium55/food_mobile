import { TabScreen } from '@/components/TabScreen';
import {
  OrdersFiltersModalContent,
  OrdersTimePeriod,
} from '@/components/admin/orders/OrdersFiltersModalContent';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useModal } from '@/contexts/ModalContext';
import { useSellerMe } from '@/hooks/useSeller';
import { useOffers } from '@/hooks/useOffers';
import { useShops } from '@/hooks/useShops';
import {
  getSellerPurchases,
  SellerPurchase,
} from '@/services/orderService';
import { SellerOrderStatus } from '@/types/sellerOrder';
import {
  getFulfillmentStatusColor,
  getFulfillmentStatusLabel,
  mapSellerPurchaseToOrder,
} from '@/utils/sellerOrderMapper';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TimePeriod = 'today' | 'week' | 'month' | 'all';

export default function AdminOrdersScreen() {
  const { seller } = useSellerMe();
  const { shops, getShopById } = useShops(seller?.id);
  const { getOfferById, fetchOffersForAdmin } = useOffers();
  const { openModal } = useModal();
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);
  const [purchases, setPurchases] = useState<SellerPurchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadSellerPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const allItems: SellerPurchase[] = [];
      let page = 1;
      let hasNext = true;
      const maxPages = 50;

      while (hasNext && page <= maxPages) {
        const response = await getSellerPurchases({ page, page_size: 100 });
        allItems.push(...response.items);
        hasNext = response.pagination.has_next;
        page += 1;
      }

      setPurchases(allItems);
    } catch (loadError: any) {
      setError(loadError?.message || 'Не удалось загрузить заказы');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSellerPurchases();
  }, [loadSellerPurchases]);

  useEffect(() => {
    if (!seller?.id) {
      return;
    }
    fetchOffersForAdmin(seller.id);
  }, [seller?.id, fetchOffersForAdmin]);

  const orders = useMemo(() => {
    return purchases
      .map((purchase) => mapSellerPurchaseToOrder(purchase, getShopById, getOfferById))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [purchases, getShopById, getOfferById]);

  const filterByTime = useCallback(
    (date: Date): boolean => {
      const now = new Date();
      if (selectedTimePeriod === 'today') {
        return date.toDateString() === now.toDateString();
      }
      if (selectedTimePeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      }
      if (selectedTimePeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      }
      return true;
    },
    [selectedTimePeriod]
  );

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!filterByTime(order.date)) {
        return false;
      }

      if (selectedShopIds.length > 0) {
        return order.shopIds.some((shopId) => selectedShopIds.includes(shopId));
      }

      return true;
    });
  }, [orders, filterByTime, selectedShopIds]);

  const completedStatuses: SellerOrderStatus[] = ['completed', 'fulfilled'];
  const activeStatuses: SellerOrderStatus[] = [
    'pending',
    'confirmed',
    'partially_fulfilled',
  ];

  const totalRevenue = filteredOrders
    .filter((order) => completedStatuses.includes(order.status))
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const completedCount = filteredOrders.filter((order) =>
    completedStatuses.includes(order.status)
  ).length;

  const activeCount = filteredOrders.filter((order) =>
    activeStatuses.includes(order.status)
  ).length;

  const handleOrderPress = (orderId: number) => {
    router.push(`/(admin)/(orders)/${orderId}`);
  };

  const handleToggleShopFilter = (shopId: number) => {
    setSelectedShopIds((prev) =>
      prev.includes(shopId) ? prev.filter((id) => id !== shopId) : [...prev, shopId]
    );
  };

  const handleClearFilters = () => {
    setSelectedTimePeriod('all');
    setSelectedShopIds([]);
  };

  const openFiltersModal = () => {
    openModal(
      <OrdersFiltersModalContent
        selectedTimePeriod={selectedTimePeriod as OrdersTimePeriod}
        selectedShopIds={selectedShopIds}
        shops={shops.map((shop) => ({
          id: shop.id,
          shortName: shop.shortName,
          address: shop.address,
        }))}
        onSelectTimePeriod={(period) => setSelectedTimePeriod(period)}
        onToggleShopFilter={handleToggleShopFilter}
        onClearFilters={handleClearFilters}
      />
    );
  };

  const hasActiveFilters = selectedTimePeriod !== 'all' || selectedShopIds.length > 0;

  const getStatusLabel = (status: SellerOrderStatus) => {
    const labels: Record<SellerOrderStatus, string> = {
      pending: 'Ожидает',
      confirmed: 'Подтвержден',
      cancelled: 'Отменен',
      completed: 'Завершен',
      fulfilled: 'Выдан',
      partially_fulfilled: 'Частично выдан',
    };
    return labels[status];
  };

  const getStatusColor = (status: SellerOrderStatus) => {
    const colors: Record<SellerOrderStatus, string> = {
      pending: '#5AC8FA',
      confirmed: '#007AFF',
      cancelled: '#FF3B30',
      completed: '#4CAF50',
      fulfilled: '#34C759',
      partially_fulfilled: '#FF9500',
    };
    return colors[status];
  };

  const getItemBadge = (item: { refundedQuantity: number; quantity: number; fulfillmentStatus: any; moneyFlowStatus: string | null }) => {
    const isFullyRefunded =
      item.moneyFlowStatus === 'at_user' ||
      (item.quantity > 0 && item.refundedQuantity >= item.quantity);
    const isPartiallyRefunded = item.refundedQuantity > 0 && item.refundedQuantity < item.quantity;

    if (isFullyRefunded) {
      return { label: 'Возвращено', color: '#B00020' };
    }

    if (isPartiallyRefunded) {
      return { label: 'Частичный возврат', color: '#C77700' };
    }

    return {
      label: getFulfillmentStatusLabel(item.fulfillmentStatus),
      color: getFulfillmentStatusColor(item.fulfillmentStatus),
    };
  };

  return (
    <TabScreen title="Заказы">
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Заказы клиентов</Text>
          </View>
          <TouchableOpacity
            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
            onPress={openFiltersModal}
          >
            <IconSymbol name="filter" size={20} color={hasActiveFilters ? '#fff' : '#007AFF'} />
            {hasActiveFilters && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {(selectedTimePeriod !== 'all' ? 1 : 0) + selectedShopIds.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.stateText}>Загрузка заказов...</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadSellerPurchases}>
              <Text style={styles.retryButtonText}>Повторить</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.countText}>Найдено: {filteredOrders.length} заказов</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Выручка</Text>
                <Text style={styles.statValue}>{totalRevenue.toFixed(2)} ₽</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Завершено</Text>
                <Text style={styles.statValue}>{completedCount}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Активных</Text>
                <Text style={styles.statValue}>{activeCount}</Text>
              </View>
            </View>

            {filteredOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Нет заказов</Text>
                <Text style={styles.emptySubtext}>
                  {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Заказы появятся здесь'}
                </Text>
              </View>
            ) : (
              <View style={styles.ordersSection}>
                {filteredOrders.map((order) => (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.orderRow}
                    onPress={() => handleOrderPress(order.id)}
                  >
                    <View style={styles.orderHeader}>
                      <View style={styles.orderHeaderLeft}>
                        <Text style={styles.orderId}>Заказ #{order.id}</Text>
                        <Text style={styles.orderDate}>
                          {order.date.toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <View
                        style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}
                      >
                        <Text style={styles.statusText}>{getStatusLabel(order.status)}</Text>
                      </View>
                    </View>

                    <View style={styles.orderInfo}>
                      <View style={styles.infoRow}>
                        <IconSymbol name="person.fill" size={14} color="#666" />
                        <Text style={styles.infoText}>Клиент ID: {order.customerId}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <IconSymbol name="map.pin.fill" size={14} color="#666" />
                        <Text style={styles.infoText}>{order.shopNames.join(', ') || 'Точка не указана'}</Text>
                      </View>
                    </View>

                    <View style={styles.orderItems}>
                      {order.items.slice(0, 2).map((item, index) => {
                        const badge = getItemBadge(item);
                        return (
                          <View key={`${item.offerId}-${index}`} style={styles.itemRow}>
                            <View style={styles.itemMain}>
                              <Text style={styles.itemText}>
                                {item.productName} x {item.quantity}
                              </Text>
                              {item.refundedQuantity > 0 ? (
                                <Text style={styles.itemRefundText}>
                                  {item.refundedQuantity >= item.quantity
                                    ? `Полный возврат (${item.refundedQuantity} шт.)`
                                    : `Частичный возврат (${item.refundedQuantity} шт.)`}
                                </Text>
                              ) : null}
                            </View>
                            <Text
                              style={[
                                styles.itemStatusBadge,
                                { backgroundColor: badge.color },
                              ]}
                            >
                              {badge.label}
                            </Text>
                          </View>
                        );
                      })}
                      {order.items.length > 2 && (
                        <Text style={styles.moreItems}>+{order.items.length - 2} еще</Text>
                      )}
                    </View>

                    <View style={styles.orderFooter}>
                      <Text style={styles.orderTotal}>{order.totalAmount.toFixed(2)} ₽</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

    </TabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  countText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  centeredState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  stateText: {
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  ordersSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    marginHorizontal: 0,
  },
  orderRow: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  orderInfo: {
    marginBottom: 12,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  orderItems: {
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  itemMain: {
    flex: 1,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
  },
  itemRefundText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B00020',
    marginTop: 2,
  },
  itemStatusBadge: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  moreItems: {
    fontSize: 13,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
});

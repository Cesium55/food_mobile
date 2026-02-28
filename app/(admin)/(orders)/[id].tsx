import { IconSymbol } from '@/components/ui/icon-symbol';
import { useOffers } from '@/hooks/useOffers';
import { getSellerPurchases, SellerPurchase } from '@/services/orderService';
import { SellerOrderStatus } from '@/types/sellerOrder';
import {
  getFulfillmentStatusColor,
  getFulfillmentStatusLabel,
  mapSellerPurchaseToOrder,
} from '@/utils/sellerOrderMapper';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSellerMe } from '@/hooks/useSeller';
import { useShops } from '@/hooks/useShops';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const orderId = typeof id === 'string' ? parseInt(id, 10) : 0;
  const { seller } = useSellerMe();
  const { getShopById } = useShops(seller?.id);
  const { getOfferById, fetchOffersForAdmin } = useOffers();
  const [purchase, setPurchase] = useState<SellerPurchase | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadPurchase = useCallback(async () => {
    if (!orderId || Number.isNaN(orderId)) {
      setError('Некорректный ID заказа');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let page = 1;
      let hasNext = true;
      let found: SellerPurchase | null = null;
      const maxPages = 50;

      while (hasNext && !found && page <= maxPages) {
        const response = await getSellerPurchases({ page, page_size: 100 });
        found = response.items.find((item) => item.id === orderId) || null;
        hasNext = response.pagination.has_next;
        page += 1;
      }

      if (!found) {
        setError(`Заказ #${orderId} не найден`);
        setPurchase(null);
        return;
      }

      setPurchase(found);
    } catch (loadError: any) {
      setError(loadError?.message || 'Не удалось загрузить заказ');
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadPurchase();
  }, [loadPurchase]);

  useEffect(() => {
    if (!seller?.id) {
      return;
    }
    fetchOffersForAdmin(seller.id);
  }, [seller?.id, fetchOffersForAdmin]);

  const order = useMemo(() => {
    if (!purchase) {
      return null;
    }
    return mapSellerPurchaseToOrder(purchase, getShopById, getOfferById);
  }, [purchase, getShopById, getOfferById]);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.stateText}>Загрузка заказа...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="arrow.left" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Заказ</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centeredState}>
          <Text style={styles.errorText}>{error || 'Заказ не найден'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPurchase}>
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = order.items.reduce(
    (sum, item) => sum + parseFloat(item.price || '0') * item.quantity,
    0
  );
  const groupedItems = order.items.reduce((acc, item) => {
    const key = item.shopId ? String(item.shopId) : `unknown:${item.shopName}`;
    if (!acc[key]) {
      acc[key] = {
        shopName: item.shopName,
        shopAddress: item.shopAddress,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { shopName: string; shopAddress?: string; items: typeof order.items }>);
  const groupedItemsArray = Object.values(groupedItems);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="arrow.left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Заказ #{order.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoSection}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.statusTextLarge}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Дата и время</Text>
          <Text style={styles.infoText}>
            {order.date.toLocaleDateString('ru-RU', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Клиент</Text>
          <View style={styles.infoRow}>
            <IconSymbol name="person.fill" size={16} color="#666" />
            <Text style={styles.infoText}>ID: {order.customerId}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Товары по торговым точкам</Text>
          {groupedItemsArray.map((group, groupIndex) => (
            <View key={`${group.shopName}-${groupIndex}`} style={styles.shopGroup}>
              <View style={styles.shopHeader}>
                <IconSymbol name="map.pin.fill" size={14} color="#666" />
                <Text style={styles.shopTitle}>{group.shopName}</Text>
              </View>
              {group.shopAddress ? (
                <Text style={styles.shopAddress}>{group.shopAddress}</Text>
              ) : null}

              {group.items.map((item, index) => (
                <View key={`${item.offerId}-${index}`} style={styles.itemCard}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemQuantity}>Количество: {item.quantity} шт</Text>
                    <View
                      style={[
                        styles.itemStatusBadge,
                        { backgroundColor: getFulfillmentStatusColor(item.fulfillmentStatus) },
                      ]}
                    >
                      <Text style={styles.itemStatusText}>
                        {getFulfillmentStatusLabel(item.fulfillmentStatus)}
                      </Text>
                    </View>
                    {item.unfulfilledReason ? (
                      <Text style={styles.reasonText}>Причина: {item.unfulfilledReason}</Text>
                    ) : null}
                  </View>
                  <View style={styles.itemRight}>
                    <Text style={styles.itemPrice}>{item.price} ₽</Text>
                    <Text style={styles.itemTotal}>
                      {(parseFloat(item.price || '0') * item.quantity).toFixed(2)} ₽
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Сумма товаров:</Text>
            <Text style={styles.totalValue}>{subtotal.toFixed(2)} ₽</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelFinal}>Итого:</Text>
            <Text style={styles.totalValueFinal}>{order.totalAmount.toFixed(2)} ₽</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#333',
  },
  shopGroup: {
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  shopTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  shopAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 4,
    gap: 8,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  itemStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  itemStatusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '700',
  },
  reasonText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemPrice: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    color: '#666',
  },
  totalValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValueFinal: {
    fontSize: 22,
    fontWeight: '700',
    color: '#007AFF',
  },
});

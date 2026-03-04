import { IconSymbol } from '@/components/ui/icon-symbol';
import { StandardModal } from '@/components/ui/StandardModal';
import { useOffers } from '@/hooks/useOffers';
import { getSellerPurchases, SellerPurchase } from '@/services/orderService';
import { refundByOfferResults } from '@/services/paymentService';
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
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [refundModalVisible, setRefundModalVisible] = useState(false);
  const [selectedRefundItem, setSelectedRefundItem] = useState<{
    purchaseOfferResultId: number;
    maxRefundable: number;
    productName: string;
  } | null>(null);
  const [refundQuantity, setRefundQuantity] = useState('1');
  const [refundReason, setRefundReason] = useState('Возврат продавцом');
  const [refunding, setRefunding] = useState(false);

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

  const getMoneyFlowLabel = (status: string | null) => {
    if (status === 'at_user') return 'Деньги у покупателя';
    if (status === 'in_system') return 'Деньги в системе';
    if (status === 'at_seller') return 'Деньги у продавца';
    return null;
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

  const getRefundableLeft = (item: { quantity: number; refundedQuantity: number; moneyFlowStatus: string | null }) => {
    if (item.moneyFlowStatus === 'at_user') {
      return 0;
    }
    const alreadyRefunded = item.refundedQuantity ?? 0;
    return Math.max(0, item.quantity - alreadyRefunded);
  };

  const openRefundModal = (item: (typeof order.items)[number]) => {
    if (!item.purchaseOfferResultId) {
      Alert.alert('Возврат недоступен', 'Для этого товара не найден ID результата выдачи.');
      return;
    }

    const refundableLeft = getRefundableLeft(item);

    if (refundableLeft <= 0) {
      Alert.alert('Возврат недоступен', 'Для этого товара больше нет доступного количества к возврату.');
      return;
    }

    setSelectedRefundItem({
      purchaseOfferResultId: item.purchaseOfferResultId,
      maxRefundable: refundableLeft,
      productName: item.productName,
    });
    setRefundQuantity(String(refundableLeft > 0 ? 1 : 0));
    setRefundReason('Возврат продавцом');
    setRefundModalVisible(true);
  };

  const handleSubmitRefund = async () => {
    if (!selectedRefundItem) return;

    const quantity = parseInt(refundQuantity, 10);
    if (Number.isNaN(quantity) || quantity <= 0) {
      Alert.alert('Ошибка', 'Укажите корректное количество для возврата.');
      return;
    }
    if (quantity > selectedRefundItem.maxRefundable) {
      Alert.alert('Ошибка', `Максимально доступно для возврата: ${selectedRefundItem.maxRefundable} шт.`);
      return;
    }
    if (!refundReason.trim()) {
      Alert.alert('Ошибка', 'Укажите причину возврата.');
      return;
    }

    try {
      setRefunding(true);
      await refundByOfferResults({
        items: [
          {
            purchase_offer_result_id: selectedRefundItem.purchaseOfferResultId,
            quantity,
          },
        ],
        reason: refundReason.trim(),
      });

      setRefundModalVisible(false);
      setSelectedRefundItem(null);
      await loadPurchase();
      Alert.alert('Успешно', 'Возврат выполнен.');
    } catch (refundError: any) {
      Alert.alert('Ошибка возврата', refundError?.message || 'Не удалось выполнить возврат.');
    } finally {
      setRefunding(false);
    }
  };

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

              {group.items.map((item, index) => {
                const badge = getItemBadge(item);
                const refundableLeft = getRefundableLeft(item);
                return (
                  <View key={`${item.offerId}-${index}`} style={styles.itemCard}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName}>{item.productName}</Text>
                      <Text style={styles.itemQuantity}>Количество: {item.quantity} шт</Text>
                      <View
                        style={[
                          styles.itemStatusBadge,
                          { backgroundColor: badge.color },
                        ]}
                      >
                        <Text style={styles.itemStatusText}>
                          {badge.label}
                        </Text>
                      </View>
                      {item.unfulfilledReason ? (
                        <Text style={styles.reasonText}>Причина: {item.unfulfilledReason}</Text>
                      ) : null}
                      {item.refundedQuantity > 0 ? (
                        <Text style={styles.refundedText}>
                          {item.refundedQuantity >= item.quantity
                            ? `Полный возврат: ${item.refundedQuantity} шт.`
                            : `Частичный возврат: ${item.refundedQuantity} шт.`}
                        </Text>
                      ) : null}
                      {getMoneyFlowLabel(item.moneyFlowStatus) ? (
                        <Text style={styles.moneyFlowText}>{getMoneyFlowLabel(item.moneyFlowStatus)}</Text>
                      ) : null}
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemPrice}>{item.price} ₽</Text>
                      <Text style={styles.itemTotal}>
                        {(parseFloat(item.price || '0') * item.quantity).toFixed(2)} ₽
                      </Text>
                      {refundableLeft > 0 ? (
                        <TouchableOpacity
                          style={styles.refundButton}
                          onPress={() => openRefundModal(item)}
                        >
                          <Text style={styles.refundButtonText}>Возврат</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.refundDoneText}>Возврат завершен</Text>
                      )}
                    </View>
                  </View>
                );
              })}
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

      <StandardModal
        visible={refundModalVisible}
        onClose={() => setRefundModalVisible(false)}
        heightPercent={0.55}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Оформить возврат</Text>
          {selectedRefundItem ? (
            <Text style={styles.modalSubtitle}>
              {selectedRefundItem.productName}. Доступно: {selectedRefundItem.maxRefundable} шт.
            </Text>
          ) : null}

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>Количество</Text>
            <TextInput
              value={refundQuantity}
              onChangeText={setRefundQuantity}
              keyboardType="numeric"
              style={styles.modalInput}
            />
          </View>

          <View style={styles.modalField}>
            <Text style={styles.modalLabel}>Причина</Text>
            <TextInput
              value={refundReason}
              onChangeText={setRefundReason}
              style={[styles.modalInput, styles.modalInputMultiline]}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.modalSubmitButton, refunding && styles.modalSubmitButtonDisabled]}
            onPress={handleSubmitRefund}
            disabled={refunding}
          >
            {refunding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.modalSubmitButtonText}>Подтвердить возврат</Text>
            )}
          </TouchableOpacity>
        </View>
      </StandardModal>
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
  refundedText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#B00020',
  },
  moneyFlowText: {
    marginTop: 2,
    fontSize: 11,
    color: '#666',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 6,
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
  refundButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refundButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  refundDoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
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
  modalContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 14,
  },
  modalField: {
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  modalInputMultiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitButtonDisabled: {
    opacity: 0.7,
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

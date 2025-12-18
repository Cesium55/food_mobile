import { TabScreen } from "@/components/TabScreen";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { useOffers } from "@/hooks/useOffers";
import { useShops } from "@/hooks/useShops";
import { CreateOrderResponse, getPurchaseById } from "@/services/orderService";
import { getPaymentByPurchaseId, getPurchaseToken } from "@/services/paymentService";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

export default function OrderPaidScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ purchaseId?: string }>();
  const { getOfferById } = useOffers();
  const { getShopById } = useShops();
  const [orderData, setOrderData] = useState<CreateOrderResponse | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      if (!params.purchaseId) {
        // Если нет purchaseId, возвращаемся на главный экран профиля
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push('/(tabs)/(profile)');
        }
        return;
      }

      try {
        setLoading(true);
        // Загружаем данные заказа
        const purchase = await getPurchaseById(parseInt(params.purchaseId));
        
        // Если заказ отменен, не загружаем платеж
        if (purchase.status === 'cancelled') {
          const orderResponse: CreateOrderResponse = {
            purchase: {
              id: purchase.id,
              user_id: purchase.user_id,
              status: purchase.status,
              total_cost: purchase.total_cost,
              created_at: purchase.created_at,
              updated_at: purchase.updated_at,
              purchase_offers: purchase.purchase_offers || [],
              ttl: purchase.ttl || 0,
            },
            offer_results: purchase.purchase_offers?.map(po => ({
              offer_id: po.offer_id,
              status: 'success' as const,
              quantity: po.quantity,
              current_cost: po.offer?.current_cost || po.cost_at_purchase || '0.00',
              original_cost: po.offer?.original_cost || po.cost_at_purchase || '0.00',
              requested_quantity: po.quantity,
              message: '',
            })) || [],
            total_processed: purchase.purchase_offers?.length || 0,
            total_failed: 0,
          };
          setOrderData(orderResponse);
          return;
        }
        
        // Загружаем данные платежа для получения времени оплаты (только для оплаченных заказов)
        if (purchase.status === 'paid' || purchase.status === 'confirmed' || purchase.status === 'completed') {
          try {
            const payment = await getPaymentByPurchaseId(parseInt(params.purchaseId));
            if (payment.status === 'succeeded' && payment.updated_at) {
              setPaymentDate(new Date(payment.updated_at));
            }
          } catch (error) {
            console.error('Ошибка загрузки платежа:', error);
          }
        }

        // Загружаем токен для QR кода (только для подтвержденных заказов)
        if (purchase.status === 'confirmed') {
          try {
            setLoadingToken(true);
            const token = await getPurchaseToken(parseInt(params.purchaseId));
            setQrToken(token);
          } catch (error) {
            console.error('Ошибка загрузки токена:', error);
          } finally {
            setLoadingToken(false);
          }
        }

        // Преобразуем в формат CreateOrderResponse
        const orderResponse: CreateOrderResponse = {
          purchase: {
            id: purchase.id,
            user_id: purchase.user_id,
            status: purchase.status,
            total_cost: purchase.total_cost,
            created_at: purchase.created_at,
            updated_at: purchase.updated_at,
            purchase_offers: purchase.purchase_offers || [],
            ttl: purchase.ttl || 0,
          },
          offer_results: purchase.purchase_offers?.map(po => ({
            offer_id: po.offer_id,
            status: 'success' as const,
            quantity: po.quantity,
            current_cost: po.offer?.current_cost || po.cost_at_purchase || '0.00',
            original_cost: po.offer?.original_cost || po.cost_at_purchase || '0.00',
            requested_quantity: po.quantity,
            message: '',
          })) || [],
          total_processed: purchase.purchase_offers?.length || 0,
          total_failed: 0,
        };

        setOrderData(orderResponse);
      } catch (error) {
        console.error('Ошибка загрузки заказа:', error);
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [params.purchaseId, router]);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <TabScreen title="Заказ оплачен" showBackButton={true}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Загрузка заказа...</Text>
        </View>
      </TabScreen>
    );
  }

  if (!orderData || !orderData.purchase) {
    return (
      <TabScreen title="Заказ оплачен" showBackButton={true}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Заказ не найден</Text>
        </View>
      </TabScreen>
    );
  }

  // Если заказ отменен, показываем специальное сообщение
  if (orderData.purchase.status === 'cancelled') {
    return (
      <TabScreen title="Заказ отменен" showBackButton={true}>
        <View style={styles.container}>
          <View style={styles.cancelledSection}>
            <Text style={styles.cancelledIcon}>❌</Text>
            <Text style={styles.cancelledTitle}>Заказ отменен</Text>
            <Text style={styles.cancelledText}>
              Этот заказ был отменен. Товары освобождены из резерва.
            </Text>
          </View>
          
          {/* Информация о заказе */}
          <View style={styles.orderInfoSection}>
            <Text style={styles.sectionTitle}>Информация о заказе</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Номер заказа:</Text>
              <Text style={styles.infoValue}>#{orderData.purchase.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Дата создания:</Text>
              <Text style={styles.infoValue}>{formatDate(new Date(orderData.purchase.created_at))}</Text>
            </View>
          </View>
        </View>
      </TabScreen>
    );
  }

  const purchase = orderData.purchase;
  const offerResults = orderData.offer_results || [];

  // Группируем товары по магазинам из purchase_offers
  const shopGroups = purchase.purchase_offers.reduce((groups, po) => {
    const offer = getOfferById(po.offer_id);
    if (!offer) return groups;

    const shop = getShopById(offer.shopId);
    if (!shop) return groups;

    const shopId = shop.id;
    if (!groups[shopId]) {
      groups[shopId] = {
        shopId: shop.id,
        shopName: shop.name,
        shopAddress: shop.address,
        items: [],
      };
    }

    groups[shopId].items.push({
      offerId: po.offer_id,
      productName: offer.productName || 'Неизвестный товар',
      quantity: po.quantity,
      currentCost: po.offer?.current_cost || po.cost_at_purchase || '0.00',
      originalCost: po.offer?.original_cost || po.cost_at_purchase || '0.00',
      shopId: shop.id,
      shopName: shop.name,
      fulfilledQuantity: po.fulfilled_quantity || 0,
      fulfillmentStatus: po.fulfillment_status,
    });

    return groups;
  }, {} as Record<number, { shopId: number; shopName: string; shopAddress?: string; items: Array<{ offerId: number; productName: string; quantity: number; currentCost: string; originalCost: string; shopId: number; shopName: string; fulfilledQuantity: number; fulfillmentStatus?: string }> }>);

  const shopGroupsArray = Object.values(shopGroups);

  const totalAmount = purchase.purchase_offers.reduce((sum, po) => {
    const cost = po.offer?.current_cost || po.cost_at_purchase || '0.00';
    return sum + (parseFloat(cost) * po.quantity);
  }, 0);

  const originalTotal = purchase.purchase_offers.reduce((sum, po) => {
    const cost = po.offer?.original_cost || po.cost_at_purchase || '0.00';
    return sum + (parseFloat(cost) * po.quantity);
  }, 0);

  const totalDiscount = originalTotal - totalAmount;

  const handleBackPress = () => {
    router.replace('/(tabs)/(profile)');
  };

  return (
    <TabScreen 
      title="Заказ оплачен" 
      showBackButton={true}
      onBackPress={handleBackPress}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Информация о времени оплаты */}
        {paymentDate && (
          <View style={styles.paymentInfoSection}>
            <Text style={styles.paymentInfoLabel}>Время оплаты:</Text>
            <Text style={styles.paymentInfoValue}>{formatDate(paymentDate)}</Text>
          </View>
        )}

        {/* QR код - показываем только для подтвержденных заказов */}
        {purchase.status === 'confirmed' && (
          loadingToken ? (
            <View style={styles.qrSection}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.qrLoadingText}>Загрузка QR кода...</Text>
            </View>
          ) : qrToken ? (
            <View style={styles.qrSection}>
              <QRCodeDisplay 
                value={qrToken} 
                size={200}
                title="QR код для получения заказа"
              />
            </View>
          ) : null
        )}

        {/* Информация о заказе */}
        <View style={styles.orderInfoSection}>
          <Text style={styles.sectionTitle}>Информация о заказе</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Номер заказа:</Text>
            <Text style={styles.infoValue}>#{purchase.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Дата создания:</Text>
            <Text style={styles.infoValue}>{formatDate(new Date(purchase.created_at))}</Text>
          </View>
        </View>

        {/* Товары по магазинам */}
        {shopGroupsArray.map((group) => (
          <View key={group.shopId} style={styles.shopSection}>
            <Text style={styles.shopName}>{group.shopName}</Text>
            {group.shopAddress && (
              <Text style={styles.shopAddress}>{group.shopAddress}</Text>
            )}
            {group.items.map((item) => {
              // Определяем статус выдачи на основе fulfillment_status
              const fulfillmentStatus = item.fulfillmentStatus;
              const fulfilledQty = item.fulfilledQuantity || 0;
              
              let statusText = '';
              let statusStyle = styles.fulfillmentTextNotFulfilled;
              
              if (fulfillmentStatus === 'fulfilled') {
                statusText = '✓ Выдан';
                statusStyle = styles.fulfillmentTextSuccess;
              } else if (fulfillmentStatus === 'partially_fulfilled') {
                statusText = `Выдано: ${fulfilledQty} из ${item.quantity}`;
                statusStyle = styles.fulfillmentTextPartial;
              } else if (fulfillmentStatus === 'unfulfilled') {
                statusText = 'Не выдан';
                statusStyle = styles.fulfillmentTextNotFulfilled;
              } else if (fulfilledQty > 0) {
                // Если статус не указан, но есть количество - определяем по количеству
                if (fulfilledQty >= item.quantity) {
                  statusText = '✓ Выдан';
                  statusStyle = styles.fulfillmentTextSuccess;
                } else {
                  statusText = `Выдано: ${fulfilledQty} из ${item.quantity}`;
                  statusStyle = styles.fulfillmentTextPartial;
                }
              } else {
                statusText = 'Не выдан';
                statusStyle = styles.fulfillmentTextNotFulfilled;
              }
              
              return (
                <View key={item.offerId} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} шт. × {item.currentCost} ₽
                    </Text>
                    {/* Статус выдачи */}
                    <View style={styles.fulfillmentStatus}>
                      <Text style={statusStyle}>
                        {statusText}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemTotal}>
                    {(parseFloat(item.currentCost) * item.quantity).toFixed(2)} ₽
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Итого */}
        <View style={styles.totalSection}>
          <Text style={styles.sectionTitle}>Итого</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Сумма:</Text>
            <Text style={styles.totalValue}>{originalTotal.toFixed(2)} ₽</Text>
          </View>
          {totalDiscount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountText]}>Скидка:</Text>
              <Text style={[styles.totalValue, styles.discountText]}>
                -{totalDiscount.toFixed(2)} ₽
              </Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.finalLabel}>К оплате:</Text>
            <Text style={styles.finalValue}>{totalAmount.toFixed(2)} ₽</Text>
          </View>
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 32,
  },
  paymentInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderInfoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shopSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fulfillmentStatus: {
    marginTop: 8,
  },
  fulfillmentTextSuccess: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
  },
  fulfillmentTextPartial: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9800',
  },
  fulfillmentTextNotFulfilled: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  totalSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  discountText: {
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  qrSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  cancelledSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelledIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  cancelledTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 8,
  },
  cancelledText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});


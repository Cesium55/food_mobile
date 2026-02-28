import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { createShopModal } from "@/components/yandex_maps_webview";
import { useModal } from "@/contexts/ModalContext";
import { useOffers } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShopPoint } from "@/hooks/useShopPoints";
import { CreateOrderResponse, getPurchaseById } from "@/services/orderService";
import { getPaymentByPurchaseId, getPurchaseToken } from "@/services/paymentService";
import { getFirstImageUrl } from "@/utils/imageUtils";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Компонент для отображения группы товаров продавца
function SellerGroup({
  sellerId,
  shopId,
  items
}: {
  sellerId: number;
  shopId: number;
  items: Array<{ offerId: number; productName: string; quantity: number; currentCost: string; originalCost: string; shopId: number; fulfilledQuantity: number; fulfillmentStatus?: string; imageUrl: string | null }>
}) {
  const { seller } = usePublicSeller(sellerId);
  const { shopPoint } = useShopPoint(shopId);
  const { openModal } = useModal();
  const [imageError, setImageError] = useState(false);
  
  const sellerName = seller?.short_name || seller?.full_name || `Продавец #${sellerId}`;
  const sellerImageUrl = getFirstImageUrl(seller?.images || []);
  const hasSellerImage = sellerImageUrl && !imageError;
  
  // Получаем адрес торговой точки
  let shopAddress = shopPoint?.address_formated || shopPoint?.address_raw;
  if (!shopAddress) {
    shopAddress = 'Адрес не указан';
  }

  const handleAddressPress = () => {
    if (shopId) {
      const { content } = createShopModal(shopId);
      openModal(content);
    }
  }

  return (
    <View style={styles.shopSection}>
      {/* Заголовок с информацией о продавце */}
      <View style={styles.sellerHeader}>
        {hasSellerImage ? (
          <Image
            source={{ uri: sellerImageUrl! }}
            style={styles.sellerAvatar}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.sellerAvatarPlaceholder}>
            <Text style={styles.sellerAvatarText}>
              {sellerName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.sellerInfo}>
          <Text style={styles.shopName}>{sellerName}</Text>
          <TouchableOpacity onPress={handleAddressPress} activeOpacity={0.7}>
            <Text style={styles.shopAddress}>{shopAddress}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Список товаров */}
      {items.map((item) => {
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
            {/* Изображение товара */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.itemImagePlaceholder}>
                <Text style={styles.itemImageText}>
                  {item.productName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
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
  );
}

// Загружаем офферы при открытии экрана, чтобы товары отображались правильно
export default function OrderPaidScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ purchaseId?: string }>();
  const { getOfferById, refetch: refetchOffers } = useOffers();
  
  // Загружаем офферы при монтировании
  useEffect(() => {
    refetchOffers({ skipExpiredFilter: true });
  }, [refetchOffers]);

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
      <ProfileScreenWrapper title="Заказ оплачен">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Загрузка заказа...</Text>
        </View>
      </ProfileScreenWrapper>
    );
  }

  if (!orderData || !orderData.purchase) {
    return (
      <ProfileScreenWrapper title="Заказ оплачен">
        <View style={styles.container}>
          <Text style={styles.errorText}>Заказ не найден</Text>
        </View>
      </ProfileScreenWrapper>
    );
  }

  // Если заказ отменен, показываем специальное сообщение
  if (orderData.purchase.status === 'cancelled') {
    return (
      <ProfileScreenWrapper title="Заказ отменен">
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
      </ProfileScreenWrapper>
    );
  }

  const purchase = orderData.purchase;
  const offerResults = orderData.offer_results || [];

  // Группируем товары по продавцам из purchase_offers
  const sellerGroups = purchase.purchase_offers.reduce((groups, po) => {
    const offer = getOfferById(po.offer_id);
    
    // Используем данные из API напрямую, если оффер не загружен
    const productName = (po.offer as any)?.product?.name 
      || offer?.productName 
      || `Товар #${po.offer.product_id}`;
    
    // Получаем sellerId из оффера или из данных API
    const sellerId = offer?.sellerId ?? (po.offer as any)?.product?.seller_id ?? null;
    const shopId = offer?.shopId ?? po.offer.shop_id;
    
    if (!sellerId) {
      // Если sellerId не найден, пропускаем товар или используем fallback
      return groups;
    }
    
    const groupKey = `${sellerId}:${shopId}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        sellerId: sellerId,
        shopId: shopId,
        items: [],
      };
    }

    // Получаем изображение товара
    const productImages = (po.offer as any)?.product?.images || offer?.productImages || [];
    const imageUrl = getFirstImageUrl(productImages);

    groups[groupKey].items.push({
      offerId: po.offer_id,
      productName: productName,
      quantity: po.quantity,
      currentCost: po.offer?.current_cost || po.cost_at_purchase || '0.00',
      originalCost: po.offer?.original_cost || po.cost_at_purchase || '0.00',
      shopId: shopId,
      fulfilledQuantity: (po as any).fulfilled_quantity || 0,
      fulfillmentStatus: (po as any).fulfillment_status,
      imageUrl: imageUrl,
    });

    return groups;
  }, {} as Record<string, { sellerId: number; shopId: number; items: Array<{ offerId: number; productName: string; quantity: number; currentCost: string; originalCost: string; shopId: number; fulfilledQuantity: number; fulfillmentStatus?: string; imageUrl: string | null }> }>);

  const sellerGroupsArray = Object.values(sellerGroups);

  const totalAmount = purchase.purchase_offers.reduce((sum, po) => {
    const cost = po.offer?.current_cost || po.cost_at_purchase || '0.00';
    return sum + (parseFloat(cost) * po.quantity);
  }, 0);

  const originalTotal = purchase.purchase_offers.reduce((sum, po) => {
    const cost = po.offer?.original_cost || po.cost_at_purchase || '0.00';
    return sum + (parseFloat(cost) * po.quantity);
  }, 0);

  const totalDiscount = originalTotal - totalAmount;

  return (
    <ProfileScreenWrapper title="Заказ оплачен">
      <View style={styles.container}>
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

        {/* Товары по продавцам */}
        {sellerGroupsArray.map((group) => (
          <SellerGroup key={`${group.sellerId}-${group.shopId}`} sellerId={group.sellerId} shopId={group.shopId} items={group.items} />
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
      </View>
    </ProfileScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
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
    borderRadius: 28,
    padding: 16,
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
    borderRadius: 28,
    padding: 16,
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
    borderRadius: 28,
    padding: 16,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  sellerInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    borderRadius: 28,
    padding: 16,
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
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
  },
  qrLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  cancelledSection: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
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

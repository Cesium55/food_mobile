import { PaymentWebView } from "@/components/payment/PaymentWebView";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { spacing } from "@/constants/tokens";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCart } from "@/hooks/useCart";
import { useOffers } from "@/hooks/useOffers";
import { useShops } from "@/hooks/useShops";
import { CreateOrderResponse, OfferResult, PurchaseOffer, getCurrentPendingPurchase, updatePurchaseStatus } from "@/services/orderService";
import { checkPaymentStatus, getPaymentByPurchaseId } from "@/services/paymentService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, AppState, BackHandler, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

const PAYMENT_ID_STORAGE_KEY = '@current_payment_id';

interface CheckoutItem {
  offerId: number;
  productName: string;
  quantity: number;
  requestedQuantity: number;
  currentCost: string; // decimal формат
  originalCost: string; // decimal формат
  expiresDate: Date | null;
  shopId: number;
  shopName: string;
  shopAddress?: string;
  status: 'success' | 'not_found' | 'insufficient_quantity' | 'expired';
  message?: string;
  processedQuantity?: number;
  availableQuantity?: number;
}

interface ShopGroup {
  shopId: number;
  shopName: string;
  shopAddress?: string;
  latitude?: number;
  longitude?: number;
  items: CheckoutItem[];
}

export default function CheckoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const params = useLocalSearchParams<{ purchaseId?: string; orderData?: string }>();
  const { shops, getShopById } = useShops();
  const { getOfferById, fetchOffers } = useOffers();
  const { getCachedOrder, clearCachedOrder, restoreItemsFromOrder } = useCart();
  
  // Загружаем offers при монтировании без фильтров (для работы getOfferById)
  useEffect(() => {
    const loadOffers = async () => {
      // Загружаем все offers без фильтров (включая просроченные, которые могут быть в заказе)
      // Вызываем fetchOffers без параметров, чтобы не применять фильтры по координатам и дате
      await fetchOffers();
    };
    loadOffers();
  }, [fetchOffers]);
  const [loadedOrderData, setLoadedOrderData] = useState<CreateOrderResponse | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentWebViewVisible, setPaymentWebViewVisible] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const [currentPaymentId, setCurrentPaymentId] = useState<number | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Парсим данные заказа из параметров
  const orderDataFromParams: CreateOrderResponse | null = useMemo(() => {
    if (!params.orderData) return null;
    try {
      return JSON.parse(params.orderData);
    } catch (error) {
      console.error('Ошибка парсинга данных заказа:', error);
      return null;
    }
  }, [params.orderData]);

  // Используем данные из параметров или загруженные данные
  // Если loadedOrderData обновлен (например, после оплаты), используем его вместо параметров
  const orderData = loadedOrderData || orderDataFromParams;

  // Инициализируем loadedOrderData данными из параметров при первой загрузке
  useEffect(() => {
    if (orderDataFromParams && !loadedOrderData) {
      setLoadedOrderData(orderDataFromParams);
    }
  }, [orderDataFromParams]);

  // Загружаем данные заказа, если есть purchaseId, но нет orderData
  useEffect(() => {
    if (params.purchaseId && !orderDataFromParams && !loadedOrderData) {
      const loadOrder = async () => {
        setLoadingOrder(true);
        try {
          const pending = await getCurrentPendingPurchase();
          if (pending && pending.purchase && pending.purchase.id.toString() === params.purchaseId) {
            // Проверяем статус заказа
            if (pending.purchase.status === 'pending') {
              setLoadedOrderData(pending);
            } else {
              // Если заказ не pending, перенаправляем на экран оплаченного заказа
              router.replace({
                pathname: '/(tabs)/(profile)/order-paid',
                params: {
                  purchaseId: params.purchaseId,
                },
              });
            }
          } else {
            // Заказ не найден как pending, возможно он уже оплачен
            // Перенаправляем на экран оплаченного заказа
            router.replace({
              pathname: '/(tabs)/(profile)/order-paid',
              params: {
                purchaseId: params.purchaseId,
              },
            });
          }
        } catch (error) {
          console.error('Ошибка загрузки заказа:', error);
          // В случае ошибки тоже перенаправляем на экран оплаченного заказа
          router.replace({
            pathname: '/(tabs)/(profile)/order-paid',
            params: {
              purchaseId: params.purchaseId,
            },
          });
        } finally {
          setLoadingOrder(false);
        }
      };
      loadOrder();
    }
  }, [params.purchaseId, orderDataFromParams, loadedOrderData, router]);

  // Проверяем статус заказа при загрузке данных из параметров и при каждом обновлении
  useEffect(() => {
    const checkOrderStatus = async () => {
      if (!orderData?.purchase?.id) return;
      
      try {
        // Всегда проверяем актуальный статус на сервере
        const pending = await getCurrentPendingPurchase();
        
        // Если заказ не найден как pending или статус не pending, перенаправляем
        if (!pending || !pending.purchase || pending.purchase.id !== orderData.purchase.id || pending.purchase.status !== 'pending') {
          // Заказ отменен или оплачен - перенаправляем
          router.replace({
            pathname: '/(tabs)/(profile)/order-paid',
            params: {
              purchaseId: orderData.purchase.id.toString(),
            },
          });
        } else {
          // Обновляем данные заказа если они изменились
          if (pending.purchase.status === 'pending') {
            setLoadedOrderData(pending);
          }
        }
      } catch (error) {
        // Если ошибка при проверке, проверяем локальный статус
        if (orderData.purchase.status !== 'pending') {
          router.replace({
            pathname: '/(tabs)/(profile)/order-paid',
            params: {
              purchaseId: orderData.purchase.id.toString(),
            },
          });
        }
      }
    };
    
    if (orderData?.purchase) {
      checkOrderStatus();
    }
  }, [orderData?.purchase?.id, router]); // Проверяем при изменении ID заказа

  const purchase = orderData?.purchase;
  const offerResults = orderData?.offer_results || [];

  // Проверяем статус заказа при каждом фокусе на экране
  useFocusEffect(
    useCallback(() => {
      const checkStatus = async () => {
        if (!params.purchaseId) return;
        
        try {
          const pending = await getCurrentPendingPurchase();
          // Если заказ не найден как pending или статус не pending, перенаправляем
          if (!pending || !pending.purchase || pending.purchase.id.toString() !== params.purchaseId || pending.purchase.status !== 'pending') {
            router.replace('/(tabs)/(cart)');
          } else {
            // Обновляем данные заказа
            setLoadedOrderData(pending);
          }
        } catch (error) {
          // Если ошибка, проверяем локальный статус
          if (orderData?.purchase && orderData.purchase.status !== 'pending') {
            router.replace('/(tabs)/(cart)');
          }
        }
      };
      
      checkStatus();
    }, [params.purchaseId, router, orderData?.purchase?.status])
  );

  // Блокируем кнопку назад если заказ отменен или оплачен
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', async () => {
      // Всегда проверяем актуальный статус на сервере
      try {
        const pending = await getCurrentPendingPurchase();
        if (!pending || !pending.purchase || (params.purchaseId && pending.purchase.id.toString() !== params.purchaseId) || pending.purchase.status !== 'pending') {
          // Заказ не pending - блокируем кнопку назад и переходим в корзину
          router.replace('/(tabs)/(cart)');
          return true; // Блокируем стандартное поведение
        }
      } catch (error) {
        // Если ошибка, проверяем локальный статус
        if (purchase && purchase.status !== 'pending') {
          router.replace('/(tabs)/(cart)');
          return true;
        }
      }
      return false; // Разрешаем стандартное поведение
    });

    return () => backHandler.remove();
  }, [purchase?.id, params.purchaseId, router]);

  // Создаем маппинг результатов по offer_id для быстрого поиска
  const offerResultsMap = useMemo(() => {
    const map = new Map<number, OfferResult>();
    offerResults.forEach(result => {
      map.set(result.offer_id, result);
    });
    return map;
  }, [offerResults]);

  // Создаем маппинг purchase_offers по offer_id для быстрого поиска
  const purchaseOffersMap = useMemo(() => {
    const map = new Map<number, PurchaseOffer>();
    if (purchase?.purchase_offers) {
      purchase.purchase_offers.forEach((purchaseOffer: PurchaseOffer) => {
        map.set(purchaseOffer.offer_id, purchaseOffer);
      });
    }
    return map;
  }, [purchase]);

  // Преобразуем offer_results в формат для отображения (показываем ВСЕ товары из корзины)
  const shopGroups: ShopGroup[] = useMemo(() => {
    if (!offerResults || offerResults.length === 0) return [];

    const grouped = new Map<number, ShopGroup>();

    // Проходим по всем offer_results (это все товары из корзины)
    offerResults.forEach((result: OfferResult) => {
      // Получаем информацию об офере из локального кэша
      const offer = getOfferById(result.offer_id);
      
      // Получаем информацию из purchase_offer
      const purchaseOffer = purchaseOffersMap.get(result.offer_id);
      
      // Определяем shopId: сначала из offer, потом из purchase_offer
      let shopId: number | undefined = offer?.shopId;
      if (!shopId && purchaseOffer) {
        shopId = purchaseOffer.offer.shop_id;
      }
      
      // Если не можем определить shopId, пропускаем
      if (!shopId) {
        console.warn(`Offer ${result.offer_id} not found in cache and no purchase_offer`);
        return;
      }
      
      // Получаем информацию о магазине
      const shop = getShopById(shopId);
      const shopName = shop?.shortName || shop?.name || offer?.shopShortName || `Магазин #${shopId}`;
      // Получаем адрес: сначала address, потом fullName, потом name, потом пустая строка
      const shopAddress = shop?.address || shop?.fullName || shop?.name || '';
      const shopLatitude = shop?.latitude;
      const shopLongitude = shop?.longitude;

      if (!grouped.has(shopId)) {
        grouped.set(shopId, {
          shopId,
          shopName,
          shopAddress,
          latitude: shopLatitude,
          longitude: shopLongitude,
          items: [],
        });
      }

      const group = grouped.get(shopId)!;
      
      // Обновляем адрес группы, если он был пустым, но теперь найден
      if (!group.shopAddress && shopAddress) {
        group.shopAddress = shopAddress;
      }
      
      // Определяем количество и стоимость
      let quantity = result.processed_quantity || 0;
      let currentCost = offer?.currentCost || '0.00';
      let originalCost = offer?.originalCost || '0.00';
      let expiresDate: Date | null = offer?.expiresDate ? new Date(offer.expiresDate) : null;
      let productName = offer?.productName || 'Товар';

      // Если есть purchase_offer, используем данные оттуда (приоритет)
      if (purchaseOffer) {
        quantity = purchaseOffer.quantity;
        currentCost = purchaseOffer.cost_at_purchase;
        originalCost = purchaseOffer.offer.original_cost;
        expiresDate = purchaseOffer.offer.expires_date ? new Date(purchaseOffer.offer.expires_date) : null;
      }

      group.items.push({
        offerId: result.offer_id,
        productName: productName,
        quantity: quantity,
        requestedQuantity: result.requested_quantity,
        currentCost: currentCost,
        originalCost: originalCost,
        expiresDate: expiresDate,
        shopId,
        shopName,
        shopAddress,
        status: result.status,
        message: result.message,
        processedQuantity: result.processed_quantity,
        availableQuantity: result.available_quantity,
      });
    });

    return Array.from(grouped.values());
  }, [offerResults, purchaseOffersMap, getOfferById, getShopById]);

  // Проверяем есть ли корректировки
  const hasAdjustments = useMemo(() => {
    return offerResults.some(result => result.status !== 'success');
  }, [offerResults]);

  // Вычисляем оставшееся время на основе created_at и ttl (не зависит от интервала)
  const calculateTimeLeft = useCallback((): number => {
    if (!purchase || purchase.status !== 'pending' || !purchase.created_at || !purchase.ttl) {
      return 300; // Fallback значение
    }

    try {
      const createdAt = new Date(purchase.created_at);
      const expiresAt = new Date(createdAt.getTime() + purchase.ttl * 1000);
      const now = new Date();
      const secondsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      return secondsLeft;
    } catch (error) {
      console.error('Ошибка вычисления времени:', error);
      return 300;
    }
  }, [purchase?.created_at, purchase?.ttl, purchase?.status]);

  const [timeLeft, setTimeLeft] = useState<number>(calculateTimeLeft);

  // Обновляем таймер когда purchase меняется
  useEffect(() => {
    const newTimeLeft = calculateTimeLeft();
    setTimeLeft(newTimeLeft);
  }, [purchase?.id, purchase?.created_at, purchase?.ttl, calculateTimeLeft]);

  // Обновляем таймер при возврате из фона
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Приложение вернулось в активное состояние - пересчитываем время
        const newTimeLeft = calculateTimeLeft();
        setTimeLeft(newTimeLeft);
      }
    });

    return () => subscription.remove();
  }, [calculateTimeLeft]);

  // Таймер для обновления UI (не влияет на вычисление времени)
  useEffect(() => {
    if (!purchase || purchase.status !== 'pending') {
      return; // Таймер не нужен для оплаченных/завершенных заказов
    }

    const currentPurchaseId = purchase.id; // Сохраняем ID текущего заказа

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0) {
        clearInterval(timer);
        // Автоматически возвращаемся в корзину при истечении времени
        // Пытаемся отменить заказ на сервере (если он еще существует)
        if (currentPurchaseId) {
          updatePurchaseStatus(currentPurchaseId, 'cancelled').catch((error) => {
            console.error('Ошибка при автоматической отмене истекшего заказа:', error);
            // Игнорируем ошибку, так как заказ мог быть уже отменен или изменен
          });
        }
        // Возвращаемся в корзину без показа Alert
        router.replace('/(tabs)/(cart)');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [purchase?.id, purchase?.status, purchase?.created_at, purchase?.ttl, calculateTimeLeft, router]);

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Расчеты
  const originalTotal = shopGroups.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => {
      return itemSum + (parseFloat(item.originalCost) * item.quantity);
    }, 0);
  }, 0);

  const availableTotal = shopGroups.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => {
      if (item.status === 'success') {
        return itemSum + (parseFloat(item.currentCost) * item.quantity);
      }
      return itemSum;
    }, 0);
  }, 0);

  const totalDiscount = originalTotal - availableTotal;

  // Количество доступных товаров
  const availableItemsCount = shopGroups.reduce((sum, group) => {
    return sum + group.items.reduce((itemSum, item) => {
      if (item.status === 'success') {
        return itemSum + item.quantity;
      }
      return itemSum;
    }, 0);
  }, 0);

  const handlePayment = async () => {
    if (availableItemsCount === 0) {
      Alert.alert('Ошибка', 'Нет доступных товаров для оплаты');
      return;
    }

    if (!purchase || !purchase.id) {
      Alert.alert('Ошибка', 'Не удалось определить ID заказа');
      return;
    }

    setIsCreatingPayment(true);
    try {
      // Получаем платеж по purchase_id (платеж создается автоматически при создании заказа)
      const payment = await getPaymentByPurchaseId(purchase.id);
      
      if (!payment.confirmation_url) {
        Alert.alert('Ошибка', 'Не удалось получить URL для оплаты');
        return;
      }
      
      // Сохраняем paymentId в AsyncStorage для проверки статуса при возврате
      await AsyncStorage.setItem(PAYMENT_ID_STORAGE_KEY, payment.id.toString());
      
      // Сохраняем данные платежа и открываем WebView
      setCurrentPaymentId(payment.id);
      setConfirmationUrl(payment.confirmation_url);
      setPaymentWebViewVisible(true);
    } catch (error: any) {
      console.error('Ошибка создания платежа:', error);
      Alert.alert(
        'Ошибка',
        error instanceof Error ? error.message : 'Не удалось создать платеж. Попробуйте еще раз.'
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // Функция для обновления данных заказа
  const refreshOrderData = useCallback(async () => {
    if (!params.purchaseId) {
      return;
    }

    try {
      // Сначала пытаемся получить pending заказ
      const pending = await getCurrentPendingPurchase();
      if (pending && pending.purchase && pending.purchase.id.toString() === params.purchaseId) {
        setLoadedOrderData(pending);
        return;
      }

      // Если заказ больше не pending (404), проверяем статус через платеж
      // Пытаемся получить paymentId из AsyncStorage или использовать currentPaymentId
      let paymentIdToCheck = currentPaymentId;
      
      if (!paymentIdToCheck) {
        try {
          const savedPaymentId = await AsyncStorage.getItem(PAYMENT_ID_STORAGE_KEY);
          if (savedPaymentId) {
            paymentIdToCheck = parseInt(savedPaymentId);
          }
        } catch (error) {
          console.error('Ошибка получения paymentId из storage:', error);
        }
      }

      if (paymentIdToCheck && !isNaN(paymentIdToCheck)) {
        // Проверяем статус платежа
        try {
          const payment = await checkPaymentStatus(paymentIdToCheck);
          console.log('📊 Статус платежа при обновлении:', payment.status, payment);
          
          if (payment.status === 'succeeded') {
            console.log('✅ Платеж успешен! Перенаправляю на экран оплаченного заказа');
            
            // Удаляем paymentId из storage
            await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
            
            // НЕ очищаем корзину - товары уже были удалены при создании заказа через cacheOrder
            // Невыбранные товары должны остаться в корзине
            await clearCachedOrder();
            
            // Перенаправляем на экран оплаченного заказа
            setLoadedOrderData((prevData) => {
              if (prevData && prevData.purchase && prevData.purchase.id) {
                router.replace({
                  pathname: '/(tabs)/(profile)/order-paid',
                  params: {
                    purchaseId: prevData.purchase.id.toString(),
                  },
                });
              }
              return prevData;
            });
          } else if (payment.status === 'canceled') {
            console.log('❌ Платеж отменен');
            // Платеж отменен - удаляем paymentId из storage
            await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
          } else {
            console.log('⏳ Платеж в процессе. Статус:', payment.status);
          }
        } catch (error) {
          console.error('❌ Ошибка проверки статуса платежа при обновлении:', error);
        }
      } else {
        // Если нет paymentId, но заказ не найден как pending, возможно он уже оплачен или отменен
        // Обновляем статус на основе того, что заказ больше не pending
        setLoadedOrderData((prevData) => {
          if (!prevData || !prevData.purchase) {
            return prevData;
          }

          // Если заказ был pending, но теперь не найден, возможно он оплачен
          // Но без проверки платежа мы не можем быть уверены, поэтому оставляем как есть
          // или можно попробовать получить заказ по ID через другой endpoint
          return prevData;
        });
      }
    } catch (error) {
      console.error('Ошибка обновления данных заказа:', error);
    }
  }, [params.purchaseId, currentPaymentId]);

  // Обработка pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOrderData();
    setRefreshing(false);
  }, [refreshOrderData]);

  const handlePaymentSuccess = async (paymentId: number) => {
    // Модалка уже закрыта в PaymentWebView, просто очищаем состояние
    setPaymentWebViewVisible(false);
    setConfirmationUrl(null);
    
    try {
      // Проверяем статус платежа на сервере
      const payment = await checkPaymentStatus(paymentId);
      
      if (payment.status === 'succeeded') {
        // Удаляем paymentId из storage, так как платеж завершен
        await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
        
        // НЕ очищаем корзину - товары уже были удалены при создании заказа через cacheOrder
        // Невыбранные товары должны остаться в корзине
        await clearCachedOrder();
        
        // Перенаправляем на экран оплаченного заказа
        if (purchase && purchase.id) {
          // Используем replace чтобы не оставлять экран оплаты в стеке навигации
          router.replace({
            pathname: '/(tabs)/(profile)/order-paid',
            params: {
              purchaseId: purchase.id.toString(),
            },
          });
        }
      } else {
        // Если статус не succeeded, показываем сообщение
        Alert.alert(
          'Внимание',
          'Платеж обрабатывается. Пожалуйста, подождите. Потяните вниз для обновления статуса.'
        );
      }
    } catch (error: any) {
      console.error('Ошибка проверки статуса платежа:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось проверить статус платежа. Потяните вниз для обновления статуса.'
      );
    }
  };

  const handlePaymentCanceled = async (paymentId: number) => {
    // Удаляем paymentId из storage при отмене
    await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
    
    // Закрываем WebView
    setPaymentWebViewVisible(false);
    setConfirmationUrl(null);
    setCurrentPaymentId(null);
    
    Alert.alert(
      'Оплата отменена',
      'Вы отменили оплату заказа.',
      [{ text: 'OK' }]
    );
  };

  const handleCloseWebView = async () => {
    // Закрываем модалку
    setPaymentWebViewVisible(false);
    setConfirmationUrl(null);
  };

  const handleCloseWebViewWithCheck = async (purchaseId: number, paymentId: number) => {
    // Закрываем модалку
    setPaymentWebViewVisible(false);
    setConfirmationUrl(null);
    
    try {
      // Проверяем статус платежа один раз
      const payment = await checkPaymentStatus(paymentId);
      
      if (payment.status === 'succeeded') {
        // Удаляем paymentId из storage, так как платеж завершен
        await AsyncStorage.removeItem(PAYMENT_ID_STORAGE_KEY).catch(() => {});
        
        // НЕ очищаем корзину - товары уже были удалены при создании заказа через cacheOrder
        // Невыбранные товары должны остаться в корзине
        await clearCachedOrder();
        
        // Перенаправляем на экран оплаченного заказа
        // handleBackPress в order-paid.tsx обработает правильную навигацию назад
        router.replace({
          pathname: '/(tabs)/(profile)/order-paid',
          params: {
            purchaseId: purchaseId.toString(),
          },
        });
      } else {
        // Если платеж не завершен, просто закрываем модалку
        handleCloseWebView();
      }
    } catch (error: any) {
      console.error('Ошибка проверки статуса платежа при закрытии:', error);
      // В случае ошибки просто закрываем модалку
      handleCloseWebView();
    }
  };

  const handleCancelOrder = async () => {
    // Всегда получаем актуальный заказ с сервера перед отменой
    let purchaseIdToCancel: number | null = null;
    
    try {
      // Пробуем получить актуальный заказ с сервера
      const pending = await getCurrentPendingPurchase();
      if (pending?.purchase?.id) {
        purchaseIdToCancel = pending.purchase.id;
      } else if (orderData?.purchase?.id) {
        // Если нет на сервере, используем из orderData
        purchaseIdToCancel = orderData.purchase.id;
      } else if (params.purchaseId) {
        // Если нет в orderData, используем из параметров
        purchaseIdToCancel = parseInt(params.purchaseId);
      }
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
      // Используем fallback
      if (orderData?.purchase?.id) {
        purchaseIdToCancel = orderData.purchase.id;
      } else if (params.purchaseId) {
        purchaseIdToCancel = parseInt(params.purchaseId);
      }
    }
    
    if (!purchaseIdToCancel) {
      Alert.alert('Ошибка', 'Не удалось определить ID заказа');
      return;
    }

    Alert.alert(
      'Отмена заказа',
      'Вы уверены, что хотите отменить заказ? Товары будут освобождены из резерва.',
      [
        { text: 'Нет', style: 'cancel' },
        { 
          text: 'Да, отменить', 
          style: 'destructive', 
          onPress: async () => {
            setIsCancelling(true);
            try {
              console.log('Отмена заказа, purchaseId:', purchaseIdToCancel);
              await updatePurchaseStatus(purchaseIdToCancel, 'cancelled');
              
              // Очищаем кэш заказа и восстанавливаем товары в корзину
              const cachedOrder = await getCachedOrder();
              if (cachedOrder && cachedOrder.purchaseId === purchaseIdToCancel) {
                await restoreItemsFromOrder(cachedOrder.reservedItems);
                await clearCachedOrder();
              }
              
              // Переходим в корзину, заменяя текущий экран
              router.replace('/(tabs)/(cart)');
            } catch (error: any) {
              console.error('Ошибка отмены заказа:', error);
              Alert.alert(
                'Ошибка',
                error instanceof Error ? error.message : 'Не удалось отменить заказ. Попробуйте еще раз.'
              );
            } finally {
              setIsCancelling(false);
            }
          }
        },
      ]
    );
  };


  const getItemStatusStyle = (status: string) => {
    switch (status) {
      case 'expired':
        return { bg: '#FFEBEE', text: '#F44336', border: '#F44336' };
      case 'not_found':
        return { bg: '#FFF3E0', text: '#FF9800', border: '#FF9800' };
      case 'insufficient_quantity':
        return { bg: '#FFF3E0', text: '#FF9800', border: '#FF9800' };
      default:
        return { bg: '#E8F5E9', text: '#4CAF50', border: '#4CAF50' };
    }
  };

  const getStatusMessage = (item: CheckoutItem): string => {
    if (item.status === 'success') {
      return '';
    }
    if (item.status === 'expired') {
      return 'Товар просрочен';
    }
    if (item.status === 'not_found') {
      return 'Товар не найден';
    }
    if (item.status === 'insufficient_quantity') {
      return `Доступно только ${item.availableQuantity || 0} шт.`;
    }
    return item.message || 'Ошибка';
  };

  const handleBackPress = () => {
    router.replace('/(tabs)/(profile)');
  };

  if (loadingOrder) {
    return (
      <SafeAreaView style={[styles.safeArea]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <IconSymbol 
              name="arrow.left" 
              color={colors.text}
              size={24}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle]}>Оформление заказа</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={[styles.loadingText]}>Загрузка данных заказа...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderData || !purchase) {
    return (
      <SafeAreaView style={[styles.safeArea]} edges={['top']}>
        <View >
          <TouchableOpacity 
            
            onPress={handleBackPress}
          >
            <IconSymbol 
              name="arrow.left" 
              color={colors.text}
              size={24}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle]}>Оформление заказа</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ошибка загрузки данных заказа</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <IconSymbol 
            name="arrow.left" 
            color={"#888888"}
            size={24}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle]} numberOfLines={1}>
          Оформление заказа
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4CAF50"
              colors={['#4CAF50']}
            />
          }
        >
          {/* Предупреждение о корректировках */}
          {hasAdjustments && (
            <View style={styles.warningSection}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Внимание! Проверьте заказ</Text>
                <Text style={styles.warningText}>
                  В вашем заказе есть изменения. Некоторые товары недоступны или их количество изменилось.
                </Text>
              </View>
            </View>
          )}

          {/* Таймер */}
          {purchase.status === 'pending' && (
            <View style={[styles.timerSection, timeLeft < 60 && styles.timerWarning]}>
              <Text style={styles.timerLabel}>Время бронирования:</Text>
              <Text style={[styles.timerText, timeLeft < 60 && styles.timerTextWarning]}>
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}

          {/* Список товаров */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Товары в заказе</Text>
            
            {shopGroups.map((group) => (
              <View key={group.shopId} style={styles.shopSection}>
                <Text style={styles.shopName}>🏪 {group.shopName}</Text>
                {group.shopAddress && (
                  <Text style={styles.shopAddress}>📍 {group.shopAddress}</Text>
                )}
                
                {group.items.map((item) => {
                  const statusStyle = getItemStatusStyle(item.status);
                  const isAvailable = item.status === 'success';
                  const statusMessage = getStatusMessage(item);
                  const hasChanges = item.status !== 'success' || item.requestedQuantity !== item.quantity;

                  return (
                    <View 
                      key={item.offerId} 
                      style={[
                        styles.itemCard,
                        !isAvailable && styles.itemCardDisabled,
                        hasChanges && styles.itemCardWithChanges,
                        { borderLeftColor: statusStyle.border }
                      ]}
                    >
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemName, !isAvailable && styles.itemNameDisabled]}>
                          {item.productName}
                        </Text>
                        
                        {/* Информация о количестве */}
                        {hasChanges ? (
                          <View style={styles.quantityChangeInfo}>
                            <Text style={styles.itemQuantity}>
                              <Text style={styles.quantityLabel}>Запрошено: </Text>
                              <Text style={styles.quantityRequested}>{item.requestedQuantity} шт.</Text>
                            </Text>
                            {item.status === 'success' && item.quantity !== item.requestedQuantity && (
                              <Text style={styles.itemQuantity}>
                                <Text style={styles.quantityLabel}>Обработано: </Text>
                                <Text style={styles.quantityProcessed}>{item.quantity} шт.</Text>
                              </Text>
                            )}
                            {item.status === 'insufficient_quantity' && (
                              <Text style={styles.itemQuantity}>
                                <Text style={styles.quantityLabel}>Доступно: </Text>
                                <Text style={styles.quantityAvailable}>{item.availableQuantity || 0} шт.</Text>
                              </Text>
                            )}
                            {item.status === 'success' && item.quantity === item.requestedQuantity && (
                              <Text style={styles.itemQuantity}>
                                {item.quantity} шт. × {item.currentCost} ₽
                              </Text>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.itemQuantity}>
                            {item.quantity} шт. × {item.currentCost} ₽
                          </Text>
                        )}

                        {/* Подробное сообщение о корректировке */}
                        {hasChanges && (() => {
                          let adjustmentMessage = '';
                          if (item.status === 'expired') {
                            adjustmentMessage = '⚠️ Товар просрочен и был удален из заказа';
                          } else if (item.status === 'not_found') {
                            adjustmentMessage = '⚠️ Товар не найден и был удален из заказа';
                          } else if (item.status === 'insufficient_quantity') {
                            adjustmentMessage = `⚠️ Недостаточно товара. Доступно только ${item.availableQuantity || 0} шт. вместо ${item.requestedQuantity} шт.`;
                          } else if (item.status === 'success' && item.quantity !== item.requestedQuantity) {
                            adjustmentMessage = `⚠️ Количество изменено: ${item.requestedQuantity} шт. → ${item.quantity} шт.`;
                          }
                          
                          if (item.message && adjustmentMessage && !adjustmentMessage.includes(item.message)) {
                            adjustmentMessage += `\n${item.message}`;
                          } else if (item.message && !adjustmentMessage) {
                            adjustmentMessage = item.message;
                          }
                          
                          return adjustmentMessage ? (
                            <View style={[styles.adjustmentInfo, { backgroundColor: statusStyle.bg }]}>
                              <Text style={[styles.adjustmentText, { color: statusStyle.text }]}>
                                {adjustmentMessage}
                              </Text>
                            </View>
                          ) : null;
                        })()}
                      </View>

                      <View style={styles.itemRight}>
                        <Text style={[
                          styles.itemTotal,
                          !isAvailable && styles.itemTotalDisabled
                        ]}>
                          {isAvailable 
                            ? `${(parseFloat(item.currentCost) * item.quantity).toFixed(2)} ₽`
                            : '—'
                          }
                        </Text>
                        {hasChanges && (
                          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                              {statusMessage || 'Изменено'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Статус заказа */}
          {purchase.status !== 'pending' && (
            <View style={styles.statusSection}>
              <View style={[
                styles.statusBadgeLarge,
                purchase.status === 'confirmed' || purchase.status === 'completed' 
                  ? styles.statusBadgeSuccess 
                  : styles.statusBadgeCancelled
              ]}>
                <Text style={styles.statusBadgeText}>
                  {purchase.status === 'confirmed' || purchase.status === 'completed' 
                    ? '✅ Заказ оплачен' 
                    : purchase.status === 'cancelled' 
                    ? '❌ Заказ отменен' 
                    : '⏳ Обработка'}
                </Text>
              </View>
            </View>
          )}

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
        {purchase.status === 'pending' && !paymentSuccess && (
          <View style={styles.fixedBottomPanel}>
            <TouchableOpacity
              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
              onPress={handleCancelOrder}
              disabled={isCancelling || isCreatingPayment}
              activeOpacity={0.7}
            >
              {isCancelling ? (
                <ActivityIndicator color="#666" size="small" />
              ) : (
                <Text style={styles.cancelButtonText}>Отменить</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.payButtonHalf,
                (availableItemsCount === 0 || isCreatingPayment) && styles.payButtonDisabled
              ]}
              onPress={handlePayment}
              disabled={availableItemsCount === 0 || isCreatingPayment}
              activeOpacity={0.7}
            >
              <View style={styles.payButtonContent}>
                {isCreatingPayment ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.payButtonText}>
                      {availableItemsCount === 0 ? 'Нет доступных товаров' : 'Оплатить'}
                    </Text>
                    {availableItemsCount > 0 && (
                      <Text style={styles.payButtonAmount}>{availableTotal.toFixed(2)} ₽</Text>
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Экран успешной оплаты */}
        {paymentSuccess && purchase && (
          <View style={styles.fixedBottomPanel}>
            <TouchableOpacity
              style={styles.successButton}
              onPress={() => router.replace('/(tabs)/(profile)/history')}
              activeOpacity={0.7}
            >
              <Text style={styles.successButtonText}>Перейти к заказам</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* WebView для оплаты */}
      {confirmationUrl && purchase && currentPaymentId && (
        <PaymentWebView
          visible={paymentWebViewVisible}
          confirmationUrl={confirmationUrl}
          purchaseId={purchase.id}
          paymentId={currentPaymentId}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCanceled={handlePaymentCanceled}
          onClose={handleCloseWebView}
          onCloseWithCheck={handleCloseWebViewWithCheck}
        />
      )}

          {/* Сообщение об успешной оплате - показываем только при первой успешной оплате */}
      {paymentSuccess && purchase && (
        <View style={styles.successOverlay}>
          <View style={styles.successContent}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>Оплата успешна!</Text>
            <Text style={styles.successText}>
              Ваш заказ #{purchase.id} успешно оплачен.
            </Text>
            <Text style={styles.successSubtext}>
              Сумма оплаты: {purchase.total_cost} ₽
            </Text>
            <TouchableOpacity
              style={styles.successCloseButton}
              onPress={() => setPaymentSuccess(false)}
            >
              <Text style={styles.successCloseButtonText}>Продолжить</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    padding: 8,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
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
  warningSection: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#E65100',
    lineHeight: 20,
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
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
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
  itemRequested: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemCardWithChanges: {
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  quantityChangeInfo: {
    marginTop: 4,
    marginBottom: 4,
  },
  quantityLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  quantityRequested: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    textDecorationLine: 'line-through',
  },
  quantityProcessed: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quantityAvailable: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  adjustmentInfo: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
  },
  adjustmentText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
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
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
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
  },
  successButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 8,
  },
  successCloseButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  successCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    marginBottom: 16,
  },
  statusBadgeLarge: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBadgeSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
});

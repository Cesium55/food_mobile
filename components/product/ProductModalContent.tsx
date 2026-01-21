import PriceChart from "@/components/product/PriceChart";
import ProductCategories from "@/components/product/ProductCategories";
import { CharacteristicItem, ProductCharacteristics } from "@/components/product/ProductCharacteristics";
import ProductImageSection from "@/components/product/ProductImageSection";
import ProductInfoCard from "@/components/product/ProductInfoCard";
import ProductPriceSection from "@/components/product/ProductPriceSection";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { createShopModal } from "@/components/yandex_maps_webview";
import { useModal } from "@/contexts/ModalContext";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useCategories";
import { Offer } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShopPoint } from "@/hooks/useShopPoints";
import { useShops } from "@/hooks/useShops";
import { getDaysUntilExpiry, getExpiryColors, getExpiryText } from "@/utils/expiryUtils";
import { getFirstImageUrl } from "@/utils/imageUtils";
import { getCurrentPrice } from "@/utils/pricingUtils";
import React, { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ProductModalContentProps {
  offer: Offer;
}

export function ProductModalContent({ offer }: ProductModalContentProps) {
  const { shops } = useShops();
  const { categories, getCategoryById } = useCategories();
  const { seller } = usePublicSeller(offer?.sellerId || null);
  const { shopPoint } = useShopPoint(offer.shopId || null);
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  
  // Получаем информацию о магазине
  const shop = shops.find(s => s.id === offer.shopId);
  const shopPointName = shopPoint 
    ? `Магазин №${shopPoint.id}` 
    : offer?.shopShortName || shop?.shortName || shop?.name || 'Магазин';
  const shopAddress = shopPoint?.address_formated || shopPoint?.address_raw || shop?.address || null;
  
  // Получаем категории товара
  const productCategories = offer?.productCategoryIds
    ? offer.productCategoryIds
        .map(id => getCategoryById(id))
        .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined)
    : [];

  // Состояние для текста срока годности (обновляется каждую секунду, если меньше суток)
  const [expiryText, setExpiryText] = useState(getExpiryText(offer.expiresDate));
  const [currentDaysUntilExpiry, setCurrentDaysUntilExpiry] = useState(getDaysUntilExpiry(offer.expiresDate));
  
  const expiryColors = getExpiryColors(currentDaysUntilExpiry);
  const isExpired = currentDaysUntilExpiry < 0;
  
  // Обновляем время каждую секунду, если осталось меньше суток
  useEffect(() => {
    const updateExpiry = () => {
      const days = getDaysUntilExpiry(offer.expiresDate);
      setCurrentDaysUntilExpiry(days);
      setExpiryText(getExpiryText(offer.expiresDate));
    };
    
    // Обновляем сразу
    updateExpiry();
    
    // Запускаем таймер для обновления каждую секунду
    // Обновляем всегда, чтобы цвета тоже обновлялись при переходе границ
    const interval = setInterval(updateExpiry, 1000);
    
    return () => clearInterval(interval);
  }, [offer.expiresDate]);

  // Преобразуем атрибуты из API в формат характеристик
  const characteristics: CharacteristicItem[] = offer.productAttributes
    ? offer.productAttributes.map(attr => ({
        key: attr.name,
        value: attr.value,
      }))
    : [];

  // Данные для корзины
  const cartItem = cartItems.find(item => item.offerId === offer.id);
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;
  
  // Цены
  const currentPrice = getCurrentPrice(offer);
  const originalPrice = parseFloat(offer.originalCost);
  const finalPrice = currentPrice ? parseFloat(currentPrice) : originalPrice;

  // Обработчики корзины
  const handleAddToCart = () => {
    addToCart(offer);
  };

  const handleIncrease = () => {
    if (cartItem && cartItem.quantity < offer.count) {
      increaseQuantity(cartItem.id, offer.count);
    }
  };

  const handleDecrease = () => {
    if (cartItem) {
      decreaseQuantity(cartItem.id);
    }
  };

  // Для аватара продавца на изображении
  const sellerImageUri = getFirstImageUrl(seller?.images);
  const sellerInitial = (seller?.short_name || 'S').charAt(0).toUpperCase();
  const [sellerImageError, setSellerImageError] = useState(false);
  const hasSellerImage = sellerImageUri && !sellerImageError;

  // Обработчик открытия модалки магазина
  const { openModal } = useModal();
  const handleShopPress = () => {
    if (offer.shopId) {
      const { content } = createShopModal(offer.shopId);
      openModal(content);
    }
  };

  return (
    <>
      {/* Изображение товара */}
      <ProductImageSection offer={offer} />

      {/* Основная информация */}
      <View style={styles.infoSection}>
        {/* Название товара со сроком годности */}
        <View style={styles.productNameRow}>
          <Text style={styles.productName} numberOfLines={2}>
            {offer.productName}
          </Text>
          <View style={[styles.expiryBadge, { backgroundColor: expiryColors.bg }]}>
            <Text style={[styles.expiryText, { color: expiryColors.text }]}>
              {expiryText}
            </Text>
          </View>
        </View>
        
        {/* Цены */}
        <ProductPriceSection offer={offer} />

        {/* Панелька торговой точки */}
        {offer.shopId && seller && (
          <TouchableOpacity 
            style={styles.shopPanel}
            activeOpacity={0.7}
            onPress={handleShopPress}
          >
            <View style={styles.shopPanelContent}>
              {/* Аватар продавца */}
              {hasSellerImage ? (
                <Image
                  source={{ uri: sellerImageUri }}
                  style={styles.shopPanelAvatarImage}
                  onError={() => setSellerImageError(true)}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.shopPanelAvatar}>
                  <Text style={styles.shopPanelAvatarText}>{sellerInitial}</Text>
                </View>
              )}
              <View style={styles.shopPanelInfo}>
                <Text style={styles.shopPanelName}>{seller.short_name}</Text>
                {shopAddress && (
                  <Text style={styles.shopPanelAddress} numberOfLines={1}>{shopAddress}</Text>
                )}
              </View>
              <IconSymbol name="chevron.right" size={18} color="#999" />
            </View>
          </TouchableOpacity>
        )}

        {/* Теги категорий */}
        <ProductCategories categories={productCategories} />

        {/* Описание */}
        {offer.productDescription && (
          <Text style={styles.description}>{offer.productDescription}</Text>
        )}

        {isExpired && (
          <View style={styles.expiredWarning}>
            <Text style={styles.expiredWarningText}>Продукт просрочен</Text>
          </View>
        )}

        {/* Важная информация */}
        {offer.description && (
          <View style={styles.importantInfo}>
            <ProductInfoCard
              icon="info.circle"
              iconColor="#9C27B0"
              label="Примечание"
              value={offer.description}
            />
          </View>
        )}
      </View>

      {/* Характеристики */}
      <View style={styles.sectionContainer}>
        <ProductCharacteristics characteristics={characteristics} />
      </View>

      {/* График изменения цены для динамического ценообразования */}
      {offer.isDynamicPricing && offer.pricingStrategy && (
        <View style={styles.chartSectionContainer}>
          <PriceChart offer={offer} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    marginHorizontal: -16,
    paddingHorizontal: 36,
    borderRadius: 0,
  },
  productNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  productName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 34,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  expiredWarning: {
    backgroundColor: '#FFE0B2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  expiredWarningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    textAlign: 'center',
  },
  // Панелька торговой точки
  shopPanel: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  shopPanelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  shopPanelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shopPanelAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  shopPanelAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopPanelInfo: {
    flex: 1,
  },
  shopPanelName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  shopPanelAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  expiryBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  importantInfo: {
    gap: 12,
  },
  // Секция примечания
  noteSection: {
    marginTop: 4,
  },
  sectionContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chartSectionContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 0, // Без боковых отступов для графика
  },
  footerPanel: {
    paddingHorizontal: 5,
    paddingTop: 16,
    paddingBottom: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    maxWidth: '70%',
  },
  quantityButton: {
    width: 40,
    height: 40,
  },
  quantityButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  quantityButtonTextDisabled: {
    color: '#999',
  },
  quantityInfo: {
    flex: 1,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  addButton: {
    // flex: 1,
    maxWidth: '30%',
  },
  addButtonInner: {
    paddingHorizontal: 7,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Компонент для footer панели
function ProductModalFooter({ offer }: { offer: Offer }) {
  const { addToCart, cartItems } = useCart();
  const { closeModal } = useModal();
  const [localQuantity, setLocalQuantity] = React.useState(1);
  
  const currentPrice = getCurrentPrice(offer);
  const originalPrice = parseFloat(offer.originalCost);
  const finalPrice = currentPrice ? parseFloat(currentPrice) : originalPrice;
  const totalPrice = finalPrice * localQuantity;

  // Проверяем, сколько уже есть в корзине
  const existingItem = cartItems.find(item => item.offerId === offer.id);
  const existingQuantity = existingItem?.quantity || 0;
  const maxAvailable = offer.count - existingQuantity;

  const handleIncrease = () => {
    const maxToAdd = Math.min(localQuantity + 1, maxAvailable);
    if (maxToAdd > localQuantity) {
      setLocalQuantity(maxToAdd);
    }
  };

  const handleDecrease = () => {
    if (localQuantity > 1) {
      setLocalQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    // Добавляем товар в корзину нужное количество раз
    for (let i = 0; i < localQuantity; i++) {
      addToCart(offer);
    }
    closeModal();
  };

  return (
    <View style={styles.footerPanel}>
      <View style={styles.footerContent}>
        {/* Левая часть: количество и кнопки +- */}
        <View style={styles.quantitySection}>
          <Pressable 
            style={styles.quantityButton}
            onPress={handleDecrease}
            disabled={localQuantity <= 1}
          >
            <View style={[
              styles.quantityButtonInner,
              localQuantity <= 1 && styles.quantityButtonDisabled
            ]}>
              <Text style={[
                styles.quantityButtonText,
                localQuantity <= 1 && styles.quantityButtonTextDisabled
              ]}>−</Text>
            </View>
          </Pressable>
          
          <View style={styles.quantityInfo}>
            <Text style={styles.quantityText}>{localQuantity} шт</Text>
            <Text style={styles.priceText}>{totalPrice.toFixed(0)} ₽</Text>
          </View>
          
          <Pressable 
            style={styles.quantityButton}
            onPress={handleIncrease}
            disabled={localQuantity >= maxAvailable}
          >
            <View style={[
              styles.quantityButtonInner,
              localQuantity >= maxAvailable && styles.quantityButtonDisabled
            ]}>
              <Text style={[
                styles.quantityButtonText,
                localQuantity >= maxAvailable && styles.quantityButtonTextDisabled
              ]}>+</Text>
            </View>
          </Pressable>
        </View>

        {/* Кнопка "Добавить" */}
        <Pressable 
          style={styles.addButton}
          onPress={handleAddToCart}
        >
          <View style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>Добавить</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// Хелпер для создания контента и footer
export function createProductModal(offer: Offer) {
  return {
    content: <ProductModalContent offer={offer} />,
    footer: <ProductModalFooter offer={offer} />,
  };
}

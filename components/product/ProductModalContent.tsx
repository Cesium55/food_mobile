import PriceChart from "@/components/product/PriceChart";
import ProductCategories from "@/components/product/ProductCategories";
import { CharacteristicItem, ProductCharacteristics } from "@/components/product/ProductCharacteristics";
import ProductImageSection from "@/components/product/ProductImageSection";
import ProductInfoCard from "@/components/product/ProductInfoCard";
import ProductPriceSection from "@/components/product/ProductPriceSection";
import { useModal } from "@/contexts/ModalContext";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useCategories";
import { Offer } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShops } from "@/hooks/useShops";
import { getCurrentPrice } from "@/utils/pricingUtils";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ProductModalContentProps {
  offer: Offer;
}

export function ProductModalContent({ offer }: ProductModalContentProps) {
  const { shops } = useShops();
  const { categories, getCategoryById } = useCategories();
  const { seller } = usePublicSeller(offer?.sellerId || null);
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  
  // Получаем название магазина по shopId
  const shop = shops.find(s => s.id === offer.shopId);
  const shopName = seller?.short_name || offer?.shopShortName || shop?.shortName || shop?.name || 'Магазин';
  
  // Получаем категории товара
  const productCategories = offer?.productCategoryIds
    ? offer.productCategoryIds
        .map(id => getCategoryById(id))
        .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined)
    : [];

  const daysUntilExpiry = Math.ceil(
    (new Date(offer.expiresDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getExpiryColor = () => {
    if (daysUntilExpiry < 0) return { bg: '#F5F5F5', text: '#999' };
    if (daysUntilExpiry >= 7) return { bg: '#E8F5E9', text: '#4CAF50' };
    if (daysUntilExpiry >= 3) return { bg: '#FFF3E0', text: '#F57C00' };
    return { bg: '#FFEBEE', text: '#F44336' };
  };

  const getDaysWord = (days: number): string => {
    const absDays = Math.abs(days);
    if (absDays === 1) return 'день';
    if (absDays >= 2 && absDays <= 4) return 'дня';
    return 'дней';
  };

  const expiryColors = getExpiryColor();
  const isExpired = daysUntilExpiry < 0;

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

  return (
    <>
      {/* Изображение товара */}
      <ProductImageSection offer={offer} />

      {/* Основная информация */}
      <View style={styles.infoSection}>
        {/* Название товара */}
        <Text style={styles.productName}>{offer.productName}</Text>
        
        {/* Цены */}
        <ProductPriceSection offer={offer} />

        {/* Теги категорий */}
        <ProductCategories categories={productCategories} />

        {/* Описание */}
        {offer.productDescription && (
          <Text style={styles.description}>{offer.productDescription}</Text>
        )}

        {isExpired && (
          <View style={styles.expiredWarning}>
            <Text style={styles.expiredWarningText}>⚠️ Продукт просрочен</Text>
          </View>
        )}

        {/* Важная информация */}
        <View style={styles.importantInfo}>
          <ProductInfoCard
            icon="storefront"
            iconColor="#4CAF50"
            label="Магазин"
            value={shopName}
          />

          {shop?.address && (
            <ProductInfoCard
              icon="location"
              iconColor="#2196F3"
              label="Адрес"
              value={shop.address}
            />
          )}

          <ProductInfoCard
            icon="calendar"
            iconColor={expiryColors.text}
            label="Срок годности"
            value={
              <View style={[styles.expiryBadge, { backgroundColor: expiryColors.bg }]}>
                <Text style={[styles.expiryText, { color: expiryColors.text }]}>
                  {isExpired ? 'Просрочен' : `${daysUntilExpiry} ${getDaysWord(daysUntilExpiry)}`}
                </Text>
              </View>
            }
          />

          <ProductInfoCard
            icon="cube"
            iconColor="#FF9800"
            label="В наличии"
            value={`${offer.count} шт.`}
          />

          {offer.description && (
            <ProductInfoCard
              icon="info.circle"
              iconColor="#9C27B0"
              label="Примечание"
              value={offer.description}
            />
          )}
        </View>
      </View>

      {/* Характеристики */}
      <View style={styles.sectionContainer}>
        <ProductCharacteristics characteristics={characteristics} />
      </View>

      {/* График изменения цены для динамического ценообразования */}
      {offer.isDynamicPricing && offer.pricingStrategy && (
        <View style={styles.sectionContainer}>
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
  productName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 34,
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
  importantInfo: {
    gap: 12,
  },
  expiryBadge: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  footerPanel: {
    paddingHorizontal: 20,
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
    maxWidth: '50%',
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
    flex: 1,
    maxWidth: '50%',
  },
  addButtonInner: {
    paddingHorizontal: 20,
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

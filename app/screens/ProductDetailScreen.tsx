import { CharacteristicItem, ProductCharacteristics } from "@/components/product/ProductCharacteristics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCart } from "@/hooks/useCart";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShops } from "@/hooks/useShops";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOfferById } = useOffers();
  const { shops } = useShops();
  const { categories, getCategoryById } = useCategories();
  const { cartItems, increaseQuantity, decreaseQuantity } = useCart();
  
  const offer = getOfferById(Number(id));
  
  // Получаем данные продавца
  const { seller } = usePublicSeller(offer?.sellerId || null);
  
  // Получаем название магазина по shopId
  const shop = offer ? shops.find(s => s.id === offer.shopId) : null;
  const shopName = seller?.short_name || offer?.shopShortName || shop?.shortName || shop?.name || 'Магазин';
  
  // Получаем категории товара
  const productCategories = offer?.productCategoryIds
    ? offer.productCategoryIds
        .map(id => getCategoryById(id))
        .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined)
    : [];

  if (!offer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="arrow.left" color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Товар не найден</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🔍</Text>
          <Text style={styles.errorText}>Товар не найден</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Вернуться назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

  // Проверяем, есть ли товар в корзине
  const cartItem = cartItems.find((item) => item.offerId === offer.id);
  const isInCart = !!cartItem;

  const handleAddToCart = () => {
    // TODO: реализовать добавление в корзину
    Alert.alert(
      'Добавлено в корзину',
      `${offer.productName} добавлен в корзину`,
      [{ text: 'OK' }]
    );
  };

  const handleIncreaseInCart = () => {
    if (cartItem) {
      increaseQuantity(cartItem.id);
    }
  };

  const handleDecreaseInCart = () => {
    if (cartItem) {
      decreaseQuantity(cartItem.id);
    }
  };

  // Преобразуем атрибуты из API в формат характеристик
  const characteristics: CharacteristicItem[] = offer.productAttributes
    ? offer.productAttributes.map(attr => ({
        key: attr.name,
        value: attr.value,
      }))
    : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" color="#333" />
        </TouchableOpacity>
        {/* <Text style={styles.headerTitle}>Карточка товара</Text>
        <View style={styles.headerSpacer} /> */}
      </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Изображение товара */}
        <View style={styles.imageSection}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {offer.productName.charAt(0)}
            </Text>
          </View>
          
          {/* Бейдж скидки */}
          {offer.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-{offer.discount}%</Text>
            </View>
          )}
        </View>

        {/* Основная информация */}
        <View style={styles.infoSection}>
          {/* Цены - теперь сверху */}
          <View style={styles.priceSectionTop}>
            <View style={styles.priceRow}>
              {offer.discount > 0 && (
                <Text style={styles.originalPriceTop}>{offer.originalCost.toFixed(2)} ₽</Text>
              )}
              <Text style={styles.currentPriceTop}>{offer.currentCost.toFixed(2)} ₽</Text>
            </View>
            {offer.discount > 0 && (
              <Text style={styles.discountText}>Экономия {((offer.originalCost - offer.currentCost).toFixed(2))} ₽</Text>
            )}
          </View>

          {/* Название товара */}
          <Text style={styles.productName}>{offer.productName}</Text>

          {/* Теги категорий */}
          {productCategories.length > 0 && (
            <View style={styles.categoriesContainer}>
              {productCategories.map((category) => (
                <View key={category.id} style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{category.name}</Text>
                </View>
              ))}
            </View>
          )}

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
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="storefront" size={20} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Магазин</Text>
                  <Text style={styles.infoValue}>{shopName}</Text>
                </View>
              </View>
            </View>

            {shop?.address && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <IconSymbol name="location" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Адрес</Text>
                    <Text style={styles.infoValue}>{shop.address}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="calendar" size={20} color={expiryColors.text} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Срок годности</Text>
                  <View style={[styles.expiryBadge, { backgroundColor: expiryColors.bg }]}>
                    <Text style={[styles.expiryText, { color: expiryColors.text }]}>
                      {isExpired ? 'Просрочен' : `${daysUntilExpiry} ${getDaysWord(daysUntilExpiry)}`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol name="cube" size={20} color="#FF9800" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>В наличии</Text>
                  <Text style={styles.infoValue}>{offer.count} шт.</Text>
                </View>
              </View>
            </View>

            {offer.description && (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <IconSymbol name="info.circle" size={20} color="#9C27B0" />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Примечание</Text>
                    <Text style={styles.infoValue}>{offer.description}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Характеристики */}
        <ProductCharacteristics characteristics={characteristics} />

        {/* Отступ для фиксированной панели */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Фиксированная панель внизу */}
      <View style={styles.fixedBottomPanel}>
        {isExpired ? (
          <View style={styles.expiredButton}>
            <Text style={styles.expiredButtonText}>Товар просрочен и недоступен</Text>
          </View>
        ) : isInCart && cartItem ? (
          <View style={styles.cartControls}>
            <Text style={styles.cartControlsLabel}>В корзине:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={handleDecreaseInCart}
                activeOpacity={0.7}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{cartItem.quantity}</Text>
              
              <TouchableOpacity 
                style={[styles.quantityButton, cartItem.quantity >= offer.count && styles.quantityButtonDisabled]}
                onPress={handleIncreaseInCart}
                disabled={cartItem.quantity >= offer.count}
                activeOpacity={0.7}
              >
                <Text style={[styles.quantityButtonText, cartItem.quantity >= offer.count && styles.quantityButtonTextDisabled]}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cartTotalPrice}>
              {(offer.currentCost * cartItem.quantity).toFixed(2)} ₽
            </Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={handleAddToCart}
            activeOpacity={0.7}
          >
            <Text style={styles.addToCartButtonText}>🛒 Добавить в корзину</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  imagePlaceholderText: {
    fontSize: 96,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  discountBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: '#FF5252',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#FF5252',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  priceSectionTop: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
    marginBottom: 4,
  },
  currentPriceTop: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  originalPriceTop: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  productName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 34,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryTag: {
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  categoryTagText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
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
  infoCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
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
  bottomSpacer: {
    height: 120,
  },
  fixedBottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartControlsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 6,
    gap: 8,
  },
  quantityButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quantityButtonTextDisabled: {
    color: '#CCC',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    minWidth: 60,
    textAlign: 'center',
  },
  cartTotalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  expiredButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  expiredButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: 'bold',
  },
});


import { CharacteristicItem, ProductCharacteristics } from "@/components/product/ProductCharacteristics";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCart } from "@/hooks/useCart";
import { useOffers } from "@/hooks/useOffers";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOfferById } = useOffers();
  const { cartItems, increaseQuantity, decreaseQuantity } = useCart();
  
  const offer = getOfferById(Number(id));

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
    (offer.expiresDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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

  // Характеристики товара (пример данных)
  const characteristics: CharacteristicItem[] = [
    { key: 'Вес', value: '500 г' },
    { key: 'Производитель', value: 'ООО "Молочный завод"' },
    { key: 'Страна', value: 'Россия' },
    { key: 'Срок хранения', value: '7 дней' },
    { key: 'Условия хранения', value: 'При температуре +2...+6°C' },
  ];

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
      <ScrollView style={styles.container}>
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
          {/* Название товара */}
          <Text style={styles.productName}>{offer.productName}</Text>

          {/* Описание */}
          <Text style={styles.description}>{offer.productDescription}</Text>

          {isExpired && (
            <View style={styles.expiredWarning}>
              <Text style={styles.expiredWarningText}>⚠️ Продукт просрочен</Text>
            </View>
          )}

          {/* Важная информация */}
          <View style={styles.importantInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>🏪 Магазин:</Text>
              <Text style={styles.infoValue}>{offer.shopShortName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Срок годности:</Text>
              <View style={[styles.expiryBadge, { backgroundColor: expiryColors.bg }]}>
                <Text style={[styles.expiryText, { color: expiryColors.text }]}>
                  {isExpired ? 'Просрочен' : `${daysUntilExpiry} ${getDaysWord(daysUntilExpiry)}`}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📦 В наличии:</Text>
              <Text style={styles.infoValue}>{offer.count} шт.</Text>
            </View>
            {offer.entryDescription && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>💡 Примечание:</Text>
                <Text style={styles.infoValue}>{offer.entryDescription}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Цены */}
        <View style={styles.priceSection}>
          <View style={styles.priceHeader}>
            <View style={styles.priceColumn}>
              <Text style={styles.priceLabel}>Старая цена</Text>
              <Text style={styles.originalPrice}>{offer.originalCost.toFixed(2)} ₽</Text>
            </View>
            <View style={styles.priceColumn}>
              <Text style={styles.priceLabel}>Цена со скидкой</Text>
              <Text style={styles.currentPrice}>{offer.currentCost.toFixed(2)} ₽</Text>
            </View>
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
    backgroundColor: '#F5F5F5',
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
    paddingVertical: 32,
    position: 'relative',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
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
    marginTop: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  expiryBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priceColumn: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
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
    borderTopColor: '#E0E0E0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    borderRadius: 12,
    padding: 4,
  },
  quantityButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
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


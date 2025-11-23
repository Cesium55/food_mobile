import CartButton from "@/components/cart/CartButton";
import { CharacteristicItem, ProductCharacteristics } from "@/components/product/ProductCharacteristics";
import ProductCategories from "@/components/product/ProductCategories";
import ProductImageSection from "@/components/product/ProductImageSection";
import ProductInfoCard from "@/components/product/ProductInfoCard";
import ProductPriceSection from "@/components/product/ProductPriceSection";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { usePublicSeller } from "@/hooks/usePublicSeller";
import { useShops } from "@/hooks/useShops";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getOfferById } = useOffers();
  const { shops } = useShops();
  const { categories, getCategoryById } = useCategories();
  
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
        <ProductImageSection offer={offer} />

        {/* Основная информация */}
        <View style={styles.infoSection}>
          {/* Цены */}
          <ProductPriceSection offer={offer} />

          {/* Название товара */}
          <Text style={styles.productName}>{offer.productName}</Text>

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
        <ProductCharacteristics characteristics={characteristics} />

        {/* Отступ для фиксированной панели */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Фиксированная панель внизу */}
      <View style={styles.fixedBottomPanel}>
        <View style={styles.cartPanel}>
          <CartButton offer={offer} size="large" variant="full" showTotal={true} />
        </View>
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
  cartPanel: {
    width: '100%',
  },
});


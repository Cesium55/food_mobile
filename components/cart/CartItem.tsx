import { CartItem as CartItemType } from "@/hooks/useCart";
import { useOffers } from "@/hooks/useOffers";
import { getFirstImageUrl } from "@/utils/imageUtils";
import { useRouter, useSegments } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ItemStatus } from "./types";

interface CartItemProps {
  item: CartItemType;
  status: ItemStatus;
  onIncrease: (itemId: number) => void;
  onDecrease: (itemId: number) => void;
  onRemove: (itemId: number) => void;
}

export function CartItem({ item, status, onIncrease, onDecrease, onRemove }: CartItemProps) {
  const router = useRouter();
  const segments = useSegments();
  const { getOfferById } = useOffers();
  const [imageError, setImageError] = useState(false);
  
  // Получаем offer для доступа к изображениям
  const offer = getOfferById(item.offerId);
  const imageUrl = offer ? getFirstImageUrl(offer.productImages) : null;
  const hasImage = imageUrl && !imageError;
  
  // Безопасная конвертация expiresDate в Date объект
  const expiryDate = item.expiresDate instanceof Date 
    ? item.expiresDate 
    : new Date(item.expiresDate || new Date());
  
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getExpiryColor = () => {
    if (daysUntilExpiry < 0) return { bg: '#F5F5F5', text: '#999' }; // Просрочен
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
  const isInactive = status.isInactive;

  const handleProductPress = () => {
    // Определяем текущую вкладку
    const currentTab = segments[0] === '(tabs)' ? segments[1] : '(cart)';
    router.push(`/(tabs)/${currentTab}/product/${item.offerId}`);
  };

  return (
    <View style={[styles.cartItem, isInactive && styles.inactiveItem]}>
      <TouchableOpacity 
        style={styles.imageButton}
        onPress={handleProductPress}
        activeOpacity={0.7}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={[styles.itemImage, isInactive && styles.inactiveImage]}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.itemImagePlaceholder, isInactive && styles.inactiveImage]}>
            <Text style={[styles.itemImageText, isInactive && styles.inactiveText]}>
              {item.productName.charAt(0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <TouchableOpacity onPress={handleProductPress} activeOpacity={0.7}>
          <Text style={[styles.itemName, isInactive && styles.inactiveTextColor]} numberOfLines={2}>
            {item.productName}
          </Text>
        </TouchableOpacity>
        
        {/* Причина неактивности */}
        {isInactive && status.inactiveReason && (
          <View style={styles.inactiveReasonContainer}>
            <Text style={styles.inactiveReasonText}>⚠️ {status.inactiveReason}</Text>
          </View>
        )}
        
        {/* Цена со скидкой */}
        <View style={styles.priceRow}>
          {item.currentCost !== null && (
            <>
              <Text style={[styles.originalPrice, isInactive && styles.inactiveTextColor]}>
                {item.originalCost.toFixed(2)} ₽
              </Text>
              <Text style={[styles.currentPrice, isInactive && styles.inactiveTextColor]}>
                {item.currentCost.toFixed(2)} ₽
              </Text>
              {item.discount > 0 && (
                <View style={[styles.itemDiscountBadge, isInactive && styles.inactiveBadge]}>
                  <Text style={styles.discountBadgeText}>-{item.discount}%</Text>
                </View>
              )}
            </>
          )}
          {item.currentCost === null && (
            <Text style={[styles.currentPrice, isInactive && styles.inactiveTextColor]}>
              Цена рассчитывается
            </Text>
          )}
        </View>

        {/* Срок годности с цветовой индикацией */}
        <View style={[styles.expiryContainer, { backgroundColor: expiryColors.bg }]}>
          <Text style={[styles.expiryText, { color: expiryColors.text }]}>
            {daysUntilExpiry < 0 ? 'Просрочен' : `${daysUntilExpiry} ${getDaysWord(daysUntilExpiry)}`}
          </Text>
        </View>
        
        {/* Кнопки количества или удаления */}
        {isInactive ? (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => onRemove(item.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.removeButtonText}>🗑️ Удалить</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => onDecrease(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => onIncrease(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.itemPriceContainer}>
        <Text style={[styles.itemTotal, isInactive && styles.inactiveTextColor]}>
          {item.currentCost !== null 
            ? (item.currentCost * item.quantity).toFixed(2) + ' ₽'
            : 'Рассчитывается'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  inactiveItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  imageButton: {
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveImage: {
    backgroundColor: '#E0E0E0',
    opacity: 0.7,
  },
  itemImageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  inactiveText: {
    color: '#9E9E9E',
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inactiveTextColor: {
    color: '#999',
  },
  inactiveReasonContainer: {
    backgroundColor: '#FFE0B2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  inactiveReasonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E65100',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  itemDiscountBadge: {
    backgroundColor: '#FF5252',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inactiveBadge: {
    backgroundColor: '#BDBDBD',
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  expiryContainer: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
  },
  removeButton: {
    backgroundColor: '#FF5252',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemPriceContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    minWidth: 90,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});


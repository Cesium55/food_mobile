import { useCart } from '@/hooks/useCart';
import { Offer } from '@/hooks/useOffers';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface CartButtonProps {
  offer: Offer;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'compact' | 'inline' | 'full';
  showTotal?: boolean; // Показывать ли итоговую стоимость в full варианте
}

export default function CartButton({ offer, size = 'medium', variant = 'default', showTotal = false }: CartButtonProps) {
  const { cartItems, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  
  // Проверяем срок годности
  const now = new Date();
  const expiryDate = new Date(offer.expiresDate);
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysUntilExpiry < 0;

  // Проверяем, есть ли товар в корзине
  const cartItem = cartItems.find(item => item.offerId === offer.id);
  const isInCart = !!cartItem;
  const isMaxQuantity = cartItem ? cartItem.quantity >= offer.count : false;

  const handleAddToCart = (e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    if (!isExpired) {
      addToCart(offer);
    }
  };

  const handleIncrease = (e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    if (cartItem && cartItem.quantity < offer.count) {
      increaseQuantity(cartItem.id, offer.count);
    }
  };

  const handleDecrease = (e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    if (cartItem) {
      decreaseQuantity(cartItem.id);
    }
  };

  // Если товар просрочен
  if (isExpired) {
    return (
      <View style={[styles.expiredButton, sizeStyles[size].expiredButton]}>
        <Text style={[styles.expiredText, sizeStyles[size].expiredText]}>Просрочен</Text>
      </View>
    );
  }

  // Если товар уже в корзине - показываем управление количеством
  if (isInCart && cartItem) {
    if (variant === 'compact') {
      return (
        <View style={styles.compactControls}>
          <TouchableOpacity
            style={[styles.compactButton, styles.compactButtonLeft]}
            onPress={handleDecrease}
            activeOpacity={0.7}
          >
            <Text style={styles.compactButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.compactQuantity}>{cartItem.quantity}</Text>
          <TouchableOpacity
            style={[
              styles.compactButton,
              styles.compactButtonRight,
              isMaxQuantity && styles.compactButtonDisabled
            ]}
            onPress={handleIncrease}
            disabled={isMaxQuantity}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.compactButtonText,
              isMaxQuantity && styles.compactButtonTextDisabled
            ]}>+</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (variant === 'inline') {
      return (
        <View style={styles.inlineControls}>
          <TouchableOpacity
            style={styles.inlineButton}
            onPress={handleDecrease}
            activeOpacity={0.7}
          >
            <Text style={styles.inlineButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.inlineQuantity}>{cartItem.quantity}</Text>
          <TouchableOpacity
            style={[styles.inlineButton, isMaxQuantity && styles.inlineButtonDisabled]}
            onPress={handleIncrease}
            disabled={isMaxQuantity}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.inlineButtonText,
              isMaxQuantity && styles.inlineButtonTextDisabled
            ]}>+</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Full variant - для детальной страницы товара
    if (variant === 'full') {
      return (
        <View style={styles.fullControls}>
          <View style={styles.fullControlsLeft}>
            <Text style={styles.fullLabel}>В корзине:</Text>
            <View style={[styles.quantityControls, sizeStyles[size].quantityControls]}>
              <TouchableOpacity
                style={[styles.quantityButton, sizeStyles[size].quantityButton]}
                onPress={handleDecrease}
                activeOpacity={0.7}
              >
                <Text style={[styles.quantityButtonText, sizeStyles[size].quantityButtonText]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.quantityText, sizeStyles[size].quantityText]}>{cartItem.quantity}</Text>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  sizeStyles[size].quantityButton,
                  isMaxQuantity && styles.quantityButtonDisabled
                ]}
                onPress={handleIncrease}
                disabled={isMaxQuantity}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quantityButtonText,
                  sizeStyles[size].quantityButtonText,
                  isMaxQuantity && styles.quantityButtonTextDisabled
                ]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          {showTotal && (
            <Text style={styles.fullTotal}>
              {(offer.currentCost * cartItem.quantity).toFixed(2)} ₽
            </Text>
          )}
        </View>
      );
    }

    // Default variant
    return (
      <View style={[styles.quantityControls, sizeStyles[size].quantityControls]}>
        <TouchableOpacity
          style={[styles.quantityButton, sizeStyles[size].quantityButton]}
          onPress={handleDecrease}
          activeOpacity={0.7}
        >
          <Text style={[styles.quantityButtonText, sizeStyles[size].quantityButtonText]}>−</Text>
        </TouchableOpacity>
        <Text style={[styles.quantityText, sizeStyles[size].quantityText]}>{cartItem.quantity}</Text>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            sizeStyles[size].quantityButton,
            isMaxQuantity && styles.quantityButtonDisabled
          ]}
          onPress={handleIncrease}
          disabled={isMaxQuantity}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.quantityButtonText,
            sizeStyles[size].quantityButtonText,
            isMaxQuantity && styles.quantityButtonTextDisabled
          ]}>+</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Кнопка "Добавить в корзину"
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactAddButton, sizeStyles[size].compactAddButton]}
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
        <Text style={[styles.compactAddButtonText, sizeStyles[size].compactAddButtonText]}>+</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'inline') {
    return (
      <TouchableOpacity
        style={[styles.inlineAddButton, sizeStyles[size].inlineAddButton]}
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
        <Text style={[styles.inlineAddButtonText, sizeStyles[size].inlineAddButtonText]}>В корзину</Text>
      </TouchableOpacity>
    );
  }

  // Full variant - для детальной страницы товара
  if (variant === 'full') {
    return (
      <TouchableOpacity
        style={[styles.fullAddButton, sizeStyles[size].fullAddButton]}
        onPress={handleAddToCart}
        activeOpacity={0.7}
      >
        <Text style={[styles.fullAddButtonText, sizeStyles[size].fullAddButtonText]}>🛒 Добавить в корзину</Text>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      style={[styles.addButton, sizeStyles[size].addButton]}
      onPress={handleAddToCart}
      activeOpacity={0.7}
    >
      <Text style={[styles.addButtonText, sizeStyles[size].addButtonText]}>В корзину</Text>
    </TouchableOpacity>
  );
}

const sizeStyles = {
  small: {
    addButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    addButtonText: {
      fontSize: 12,
    },
    quantityControls: {
      paddingVertical: 4,
      paddingHorizontal: 6,
      borderRadius: 6,
    },
    quantityButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
    },
    quantityButtonText: {
      fontSize: 16,
    },
    quantityText: {
      fontSize: 13,
      paddingHorizontal: 8,
      minWidth: 30,
    },
    expiredButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    expiredText: {
      fontSize: 12,
    },
    compactAddButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    compactAddButtonText: {
      fontSize: 18,
    },
    inlineAddButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    inlineAddButtonText: {
      fontSize: 12,
    },
    fullAddButton: {
      paddingVertical: 18,
      borderRadius: 16,
    },
    fullAddButtonText: {
      fontSize: 18,
      letterSpacing: 0.5,
    },
  },
  medium: {
    addButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    addButtonText: {
      fontSize: 14,
    },
    quantityControls: {
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    quantityButtonText: {
      fontSize: 20,
    },
    quantityText: {
      fontSize: 16,
      paddingHorizontal: 12,
      minWidth: 40,
    },
    expiredButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    expiredText: {
      fontSize: 14,
    },
    compactAddButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    compactAddButtonText: {
      fontSize: 20,
    },
    inlineAddButton: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 8,
    },
    inlineAddButtonText: {
      fontSize: 13,
    },
  },
  large: {
    addButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
    },
    addButtonText: {
      fontSize: 16,
    },
    quantityControls: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    quantityButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    quantityButtonText: {
      fontSize: 24,
    },
    quantityText: {
      fontSize: 18,
      paddingHorizontal: 16,
      minWidth: 50,
    },
    expiredButton: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 10,
    },
    expiredText: {
      fontSize: 16,
    },
    compactAddButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    compactAddButtonText: {
      fontSize: 24,
    },
    inlineAddButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    inlineAddButtonText: {
      fontSize: 14,
    },
    fullAddButton: {
      paddingVertical: 18,
      borderRadius: 16,
    },
    fullAddButtonText: {
      fontSize: 18,
      letterSpacing: 0.5,
    },
  },
};

const styles = StyleSheet.create({
  addButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  quantityButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  quantityButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  quantityButtonText: {
    color: '#fff',
    fontWeight: '600',
    lineHeight: 22,
  },
  quantityButtonTextDisabled: {
    color: '#999',
  },
  quantityText: {
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  expiredButton: {
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiredText: {
    color: '#F44336',
    fontWeight: '600',
  },
  // Compact variant
  compactControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  compactButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  compactButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  compactButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  compactButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  compactButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  compactButtonTextDisabled: {
    color: '#999',
  },
  compactQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  compactAddButton: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Inline variant
  inlineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  inlineButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  inlineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inlineButtonTextDisabled: {
    color: '#999',
  },
  inlineQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  inlineAddButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineAddButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Full variant styles
  fullControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  fullControlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fullTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  fullAddButton: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fullAddButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});


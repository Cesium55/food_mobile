import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import HorizontalOfferBlock from './offers/horizontalOfferBlock';
import { IconSymbol } from './ui/icon-symbol';

interface Shop {
  id: number;
  name: string;
  address: string;
  phone: string;
  rating: number;
  image: string;
  description: string;
  workingHours: string;
  distance: string;
}

interface ShopModalProps {
  visible: boolean;
  shop: Shop | null;
  onClose: () => void;
}

export default function ShopModal({ visible, shop, onClose }: ShopModalProps) {
  if (!shop) return null;

  // Демо-товары для магазина
  const demoOffers = [
    {
      id: 1,
      productId: 1,
      productName: 'Молоко пастеризованное 3.2%',
      productDescription: 'Натуральное коровье молоко высшего качества',
      categoryId: 11,
      shopId: 1,
      shopShortName: shop.name,
      sellerId: 1,
      expiresDate: new Date('2025-10-25'),
      originalCost: 89.90,
      currentCost: 69.90,
      discount: 22,
      count: 45,
      entryDescription: 'Свежее поступление',
    },
    {
      id: 2,
      productId: 2,
      productName: 'Хлеб Бородинский',
      productDescription: 'Ржаной хлеб с кориандром',
      categoryId: 42,
      shopId: 1,
      shopShortName: shop.name,
      sellerId: 1,
      expiresDate: new Date('2025-10-23'),
      originalCost: 65.00,
      currentCost: 45.00,
      discount: 31,
      count: 12,
      entryDescription: 'Свежая выпечка',
    },
    {
      id: 3,
      productId: 3,
      productName: 'Яблоки Гренни Смит',
      productDescription: 'Сочные зеленые яблоки',
      categoryId: 1,
      shopId: 1,
      shopShortName: shop.name,
      sellerId: 1,
      expiresDate: new Date('2025-10-28'),
      originalCost: 120.00,
      currentCost: 89.00,
      discount: 26,
      count: 8,
      entryDescription: 'Свежие фрукты',
    }
  ];

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
    >
      <View style={styles.modalContainer}>
        {/* Заголовок */}
        <View style={styles.header}>
            <TouchableOpacity 
              style={styles.headerBackButton}
              onPress={onClose}
            >
              <IconSymbol name="xmark" color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {shop.name}
            </Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Контент */}
          <ScrollView style={styles.container}>
            {/* Информация о магазине */}
            <View style={styles.shopInfo}>
              <View style={styles.shopIcon}>
                <Text style={styles.shopIconText}>🏪</Text>
              </View>
              <View style={styles.shopDetails}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopAddress}>📍 {shop.address}</Text>
                {shop.phone && (
                  <TouchableOpacity>
                    <Text style={styles.shopPhone}>📞 {shop.phone}</Text>
                  </TouchableOpacity>
                )}
                {shop.workingHours && (
                  <Text style={styles.shopHours}>🕒 {shop.workingHours}</Text>
                )}
              </View>
            </View>



            {/* Товары со скидкой */}
            <View style={styles.offersSection}>
              <Text style={styles.sectionTitle}>
                Предложения ({demoOffers.length})
              </Text>
              
              <View style={styles.offersList}>
                {demoOffers.map((offer) => (
                  <HorizontalOfferBlock key={offer.id} offer={offer} />
                ))}
              </View>
            </View>

            {/* Отступ снизу */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
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
  shopInfo: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  shopIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopIconText: {
    fontSize: 40,
  },
  shopDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  shopAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  shopPhone: {
    fontSize: 14,
    color: '#2196F3',
    marginBottom: 4,
  },
  shopHours: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  mapCard: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 16,
  },
  mapPlaceholder: {
    height: 150,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  mapText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  offersSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});
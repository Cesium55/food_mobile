import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Modal from 'react-native-modal';
import { useOffers } from '@/hooks/useOffers';
import HorizontalOfferBlock from './offers/horizontalOfferBlock';
import { IconSymbol } from './ui/icon-symbol';

interface Shop {
  id: number;
  name: string;
  address: string;
}

interface ShopModalProps {
  visible: boolean;
  shop: Shop | null;
  onClose: () => void;
}

export default function ShopModal({ visible, shop, onClose }: ShopModalProps) {
  const { getOffersByShop, loading } = useOffers();
  
  // Получаем офферы для данного магазина из API
  const shopOffers = shop ? getOffersByShop(shop.id) : [];

  if (!shop) return null;

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
              </View>
                         </View>

             {/* Товары со скидкой */}
             <View style={styles.offersSection}>
               <Text style={styles.sectionTitle}>
                 Предложения ({shopOffers.length})
               </Text>
               
               {loading ? (
                 <View style={styles.loadingContainer}>
                   <ActivityIndicator size="small" color="#007AFF" />
                   <Text style={styles.loadingText}>Загрузка предложений...</Text>
                 </View>
               ) : shopOffers.length === 0 ? (
                 <View style={styles.emptyContainer}>
                   <Text style={styles.emptyText}>Нет доступных предложений</Text>
                 </View>
               ) : (
                 <View style={styles.offersList}>
                   {shopOffers.map((offer) => (
                     <HorizontalOfferBlock key={offer.id} offer={offer} />
                   ))}
                 </View>
               )}
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
  offersList: {
    gap: 12,
  },
  bottomSpacer: {
    height: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
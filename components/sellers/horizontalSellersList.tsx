import { createSellerModal } from '@/components/sellers/SellerModalContent';
import { useModal } from '@/contexts/ModalContext';
import { PublicSeller } from '@/hooks/usePublicSeller';
import { useSellers } from '@/hooks/useSellers';
import { getFirstImageUrl } from '@/utils/imageUtils';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const AVATAR_SIZE = 90;

export default function HorizontalSellersList() {
  const { sellers } = useSellers();
  const { openModal } = useModal();

  const handleSellerPress = (sellerId: number) => {
    // Открываем модалку продавца
    const { content } = createSellerModal(sellerId);
    openModal(content);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {sellers.map((seller) => (
        <SellerAvatar 
          key={seller.id} 
          seller={seller} 
          onPress={() => handleSellerPress(seller.id)} 
        />
      ))}
    </ScrollView>
  );
}

interface SellerAvatarProps {
  seller: PublicSeller;
  onPress: () => void;
}

function SellerAvatar({ seller, onPress }: SellerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Получаем URL первого изображения
  const imageUrl = getFirstImageUrl(seller.images);
  const hasImage = imageUrl && !imageError;

  return (
    <View style={styles.sellerItem}>
      <TouchableOpacity 
        style={styles.avatarContainer} 
        activeOpacity={0.7}
        onPress={onPress}
      >
        {hasImage ? (
          <Image
            source={{ uri: imageUrl! }}
            style={styles.avatarImage}
            onError={() => setImageError(true)}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {seller.short_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={styles.sellerName} numberOfLines={2}>
        {seller.short_name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  contentContainer: {
    gap: AVATAR_SIZE * 0.1875,
  },
  sellerItem: {
    alignItems: 'center',
    width: AVATAR_SIZE * 1.25,
  },
  avatarContainer: {
    marginBottom: AVATAR_SIZE * 0.125,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: AVATAR_SIZE * 0.0625,
    elevation: 3,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: AVATAR_SIZE * 0.0625,
    elevation: 3,
  },
  avatarText: {
    fontSize: AVATAR_SIZE * 0.375,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sellerName: {
    fontSize: AVATAR_SIZE * 0.1875,
    textAlign: 'center',
    color: '#333',
    fontWeight: '500',
  },
});


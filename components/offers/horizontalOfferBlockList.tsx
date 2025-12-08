import { Offer, useOffers } from '@/hooks/useOffers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import HorizontalOfferBlock from './horizontalOfferBlock';

interface HorizontalOfferBlockListProps {
  offers?: Offer[];
  onOfferPress?: (offer: Offer) => void;
  limit?: number;
}

export default function HorizontalOfferBlockList({ 
  offers: offersProp,
  onOfferPress, 
  limit 
}: HorizontalOfferBlockListProps) {
  const { offers: offersFromHook } = useOffers();
  const offers = offersProp || offersFromHook;
  
  // Фильтруем предложения: показываем только те, у которых срок годности еще не истек
  // (дополнительная проверка на клиенте, основная фильтрация должна быть на сервере)
  const now = new Date();
  const validOffers = offers.filter(offer => {
    const expiresDate = new Date(offer.expiresDate);
    return expiresDate > now;
  });
  
  const displayOffers = limit ? validOffers.slice(0, limit) : validOffers;

  return (
    <View style={styles.container}>
      {displayOffers.map((offer) => (
        <HorizontalOfferBlock 
          key={offer.id} 
          offer={offer} 
          onPress={onOfferPress}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
});


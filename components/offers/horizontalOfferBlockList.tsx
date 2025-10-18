import { Offer, useOffers } from '@/hooks/useOffers';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import HorizontalOfferBlock from './horizontalOfferBlock';

interface HorizontalOfferBlockListProps {
  onOfferPress?: (offer: Offer) => void;
  limit?: number;
}

export default function HorizontalOfferBlockList({ 
  onOfferPress, 
  limit 
}: HorizontalOfferBlockListProps) {
  const { offers } = useOffers();
  
  const displayOffers = limit ? offers.slice(0, limit) : offers;

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


import { StyleSheet, Text, View } from 'react-native';

import { TabScreen } from '@/components/TabScreen';
import HorizontalOfferBlockList from '@/components/offers/horizontalOfferBlockList';
import Search from '@/components/search/search';
import HorizontalSellersList from '@/components/sellers/horizontalSellersList';
import { useOffers } from '@/hooks/useOffers';
import { getCurrentLocation } from '@/services/locationService';
import { getBoundingBox } from '@/utils/locationUtils';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
  const { offers, fetchOffersWithLocation } = useOffers();

  useEffect(() => {
    const loadOffersWithLocation = async () => {
      const location = await getCurrentLocation();
      if (location) {
        const boundingBox = getBoundingBox(location.latitude, location.longitude, 1000);
        await fetchOffersWithLocation(boundingBox);
      } else {
        // Если местоположение недоступно, загружаем без фильтров
        await fetchOffersWithLocation({
          minLatitude: -90,
          maxLatitude: 90,
          minLongitude: -180,
          maxLongitude: 180,
        });
      }
    };

    loadOffersWithLocation();
  }, [fetchOffersWithLocation]);

  return (
    <TabScreen title="Home">
      <View style={styles.searchContainer}>

        <Search
          placeholder="Поиск..."
          value={searchText}
          onChangeText={setSearchText}
        />


      </View>



      <View style={styles.blockContainer}>

        <Text style={styles.blockTitle}>Популярные продавцы</Text>
        <HorizontalSellersList />

      </View>

      <View style={styles.blockContainer}>

        <Text style={styles.blockTitle}>Рекомендуемые продукты</Text>
        <View style={styles.offersContainer}>

          <HorizontalOfferBlockList
            offers={offers}
            limit={10}
          />

        </View>
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    width: '80%',
    alignSelf: 'center',
  },
  blockContainer: {
    // alignSelf: 'center',
  },
  blockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    padding: 16,
  },
  offersContainer: {
    paddingHorizontal: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});

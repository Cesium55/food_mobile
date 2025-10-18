import { StyleSheet, Text, View } from 'react-native';

import { TabScreen } from '@/components/TabScreen';
import HorizontalOfferBlockList from '@/components/offers/horizontalOfferBlockList';
import Search from '@/components/search/search';
import HorizontalSellersList from '@/components/sellers/horizontalSellersList';
import { useState } from 'react';

export default function HomeScreen() {
  const [searchText, setSearchText] = useState('');
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

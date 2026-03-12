import { GridOfferList } from '@/components/offers/GridOfferList';
import { createProductModal } from '@/components/product/ProductModalContent';
import Search from '@/components/search/search';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { spacing, typography } from '@/constants/tokens';
import { useModal } from '@/contexts/ModalContext';
import { useColors } from '@/contexts/ThemeContext';
import { Offer, useOffers } from '@/hooks/useOffers';
import { getLocationWithCache } from '@/services/locationService';
import { getBoundingBox } from '@/utils/locationUtils';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof q === 'string' ? q : '';
  const [searchText, setSearchText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [searchNonce, setSearchNonce] = useState(initialQuery.trim() ? 1 : 0);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const { offers, fetchOffers, fetchOffersWithLocation, loading } = useOffers();
  const { openModal } = useModal();
  const colors = useColors();
  const styles = createStyles(colors);

  useEffect(() => {
    const normalizedQuery = initialQuery.trim();
    setSearchText(initialQuery);
    setSubmittedQuery(normalizedQuery);
    setSearchNonce(normalizedQuery ? 1 : 0);
    setHasCompletedSearch(false);
  }, [initialQuery]);

  useEffect(() => {
    if (!submittedQuery || searchNonce === 0) {
      return;
    }

    let isActive = true;

    const runSearch = async () => {
      setHasCompletedSearch(false);
      const { location } = await getLocationWithCache();

      if (!isActive) {
        return;
      }

      if (location) {
        const boundingBox = getBoundingBox(location.latitude, location.longitude, 1000);
        await fetchOffersWithLocation({
          ...boundingBox,
          searchQuery: submittedQuery,
        });

        if (isActive) {
          setHasCompletedSearch(true);
        }
        return;
      }

      await fetchOffers({ searchQuery: submittedQuery });
      if (isActive) {
        setHasCompletedSearch(true);
      }
    };

    runSearch();

    return () => {
      isActive = false;
    };
  }, [fetchOffers, fetchOffersWithLocation, searchNonce, submittedQuery]);

  const handleSearchSubmit = () => {
    const trimmedQuery = searchText.trim();
    setSubmittedQuery(trimmedQuery);
    setSearchNonce((current) => current + 1);
  };

  const handleOfferPress = (offer: Offer) => {
    const { content, footer } = createProductModal(offer);
    openModal(content, footer);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <IconSymbol name="arrow.left" color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.searchWrapper}>
          <Search
            placeholder="Найти товар или продавца"
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={handleSearchSubmit}
            autoFocus={!initialQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!submittedQuery ? (
          <View style={styles.centerState}>
            <Text style={styles.title}>Поиск</Text>
            <Text style={styles.subtitle}>Введите запрос и нажмите кнопку поиска</Text>
          </View>
        ) : (!hasCompletedSearch || loading) && offers.length === 0 ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.subtitle}>Ищем результаты по запросу "{submittedQuery}"</Text>
          </View>
        ) : hasCompletedSearch && offers.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.title}>Ничего не найдено</Text>
            <Text style={styles.subtitle}>Попробуйте другой запрос</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsTitle}>Результаты: {submittedQuery}</Text>
            <GridOfferList
              offers={offers}
              onOfferPress={handleOfferPress}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background.default,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  searchWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  centerState: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  resultsTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
});

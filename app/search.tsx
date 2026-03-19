import { GridOfferList } from '@/components/offers/GridOfferList';
import { createProductModal } from '@/components/product/ProductModalContent';
import { SearchFiltersModal, SearchFiltersValue } from '@/components/search/SearchFiltersModal';
import Search from '@/components/search/search';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { spacing, typography } from '@/constants/tokens';
import { useModal } from '@/contexts/ModalContext';
import { useColors } from '@/contexts/ThemeContext';
import { Offer, useOffers } from '@/hooks/useOffers';
import { getLocationWithCache } from '@/services/locationService';
import { getBoundingBox } from '@/utils/locationUtils';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function hasActiveFilters(filters: SearchFiltersValue) {
  return Boolean(
    filters.searchQuery.trim() ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.minExpiryDate !== undefined ||
      filters.maxExpiryDate !== undefined ||
      filters.minCount !== undefined ||
      filters.dynamicPricing !== undefined ||
      filters.categoryIds.length > 0
  );
}

function buildServerFilters(filters: SearchFiltersValue) {
  const toDateOnly = (value?: string) => {
    if (!value) return undefined;
    return new Date(value).toISOString().split('T')[0];
  };

  return {
    searchQuery: filters.searchQuery.trim(),
    categoryIds: filters.categoryIds,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minCount: filters.minCount,
    isDynamicPricing: filters.dynamicPricing,
    minExpiresDate: toDateOnly(filters.minExpiryDate),
    maxExpiresDate: toDateOnly(filters.maxExpiryDate),
  };
}

function getOfferCurrentPrice(offer: Offer) {
  const rawValue = offer.currentCost ?? offer.originalCost;
  const parsedValue = Number(rawValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export default function SearchScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof q === 'string' ? q : '';
  const [searchText, setSearchText] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery.trim());
  const [appliedFilters, setAppliedFilters] = useState<SearchFiltersValue>({
    searchQuery: initialQuery.trim(),
    categoryIds: [],
  });
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
    setAppliedFilters({
      searchQuery: normalizedQuery,
      categoryIds: [],
    });
    setSearchNonce(normalizedQuery ? 1 : 0);
    setHasCompletedSearch(false);
  }, [initialQuery]);

  useEffect(() => {
    if (searchNonce === 0 || !hasActiveFilters(appliedFilters)) {
      return;
    }

    let isActive = true;
    const requestFilters = buildServerFilters(appliedFilters);

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
          ...requestFilters,
        });

        if (isActive) {
          setHasCompletedSearch(true);
        }
        return;
      }

      await fetchOffers(requestFilters);
      if (isActive) {
        setHasCompletedSearch(true);
      }
    };

    runSearch();

    return () => {
      isActive = false;
    };
  }, [appliedFilters, fetchOffers, fetchOffersWithLocation, searchNonce]);

  const filteredOffers = useMemo(() => {
    const now = Date.now();

    return offers.filter((offer) => {
      const currentPrice = getOfferCurrentPrice(offer);
      const expiresAt = new Date(offer.expiresDate).getTime();

      if (appliedFilters.minPrice !== undefined && currentPrice < appliedFilters.minPrice) {
        return false;
      }

      if (appliedFilters.maxPrice !== undefined && currentPrice > appliedFilters.maxPrice) {
        return false;
      }

      if (
        appliedFilters.minExpiryDate !== undefined &&
        expiresAt < new Date(appliedFilters.minExpiryDate).getTime()
      ) {
        return false;
      }

      if (
        appliedFilters.maxExpiryDate !== undefined &&
        expiresAt > new Date(appliedFilters.maxExpiryDate).getTime()
      ) {
        return false;
      }

      if (appliedFilters.minCount !== undefined && offer.count < appliedFilters.minCount) {
        return false;
      }

      if (
        appliedFilters.dynamicPricing !== undefined &&
        offer.isDynamicPricing !== appliedFilters.dynamicPricing
      ) {
        return false;
      }

      if (
        appliedFilters.categoryIds.length > 0 &&
        !appliedFilters.categoryIds.some((categoryId) => offer.productCategoryIds.includes(categoryId))
      ) {
        return false;
      }

      return true;
    });
  }, [appliedFilters, offers]);

  const handleSearchSubmit = () => {
    const trimmedQuery = searchText.trim();
    const nextFilters = {
      ...appliedFilters,
      searchQuery: trimmedQuery,
    };
    setSubmittedQuery(trimmedQuery);
    setAppliedFilters(nextFilters);
    setSearchNonce((current) => current + 1);
  };

  const handleApplyFilters = (value: SearchFiltersValue) => {
    const normalizedQuery = value.searchQuery.trim();
    const nextFilters = {
      ...value,
      searchQuery: normalizedQuery,
    };
    setSearchText(normalizedQuery);
    setSubmittedQuery(normalizedQuery);
    setAppliedFilters(nextFilters);
    setSearchNonce((current) => current + 1);
  };

  const handleOfferPress = (offer: Offer) => {
    const { content, footer } = createProductModal(offer);
    openModal(content, footer);
  };

  const handleOpenFiltersModal = () => {
    openModal(
      <SearchFiltersModal
        initialValue={appliedFilters}
        onApply={handleApplyFilters}
      />
    );
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
            placeholder="Поиск"
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={handleSearchSubmit}
            autoFocus={!initialQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleOpenFiltersModal}
          activeOpacity={0.7}
        >
          <IconSymbol name="filter" size={22} color={colors.text.primary} />
          {hasActiveFilters({ ...appliedFilters, searchQuery: '' }) && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasActiveFilters(appliedFilters) ? (
          <View style={styles.centerState}>
            <Text style={styles.title}>Поиск</Text>
            <Text style={styles.subtitle}>Введите запрос и нажмите кнопку поиска</Text>
          </View>
        ) : !hasCompletedSearch || loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text style={styles.subtitle}>
              {submittedQuery
                ? `Ищем результаты по запросу "${submittedQuery}"`
                : 'Ищем результаты по заданным фильтрам'}
            </Text>
          </View>
        ) : hasCompletedSearch && filteredOffers.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.title}>Ничего не найдено</Text>
            <Text style={styles.subtitle}>Попробуйте другой запрос</Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsTitle}>
              {submittedQuery ? `Результаты: ${submittedQuery}` : 'Результаты по фильтрам'}
            </Text>
            <GridOfferList
              offers={filteredOffers}
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
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

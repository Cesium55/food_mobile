import { TabScreen } from "@/components/TabScreen";
import VerticalOfferCard from "@/components/offers/VerticalOfferCard";
import { useCategories } from "@/hooks/useCategories";
import { useOffers } from "@/hooks/useOffers";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const ROW_HEIGHT = 70;

export default function CategoryDetail() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const { getCategoryById, getSubCategories, getCategoryPath } = useCategories();
  const { getOffersByCategory } = useOffers();
  
  const category = getCategoryById(Number(categoryId));
  const subCategories = getSubCategories(Number(categoryId));
  const breadcrumbs = getCategoryPath(Number(categoryId));
  const offers = getOffersByCategory(Number(categoryId));

  if (!category) {
    return (
      <TabScreen title="Ошибка" showBackButton={true}>
        <View style={styles.container}>
          <Text>Категория не найдена</Text>
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen title={category.name} showBackButton={true}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.container}>
          {/* Breadcrumbs */}
          <View style={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, index) => (
              <View key={crumb.id} style={styles.breadcrumbItem}>
                {index > 0 && <Text style={styles.breadcrumbSeparator}>/</Text>}
                <Text 
                  style={[
                    styles.breadcrumbText,
                    index === breadcrumbs.length - 1 && styles.breadcrumbActive
                  ]}
                >
                  {crumb.name}
                </Text>
              </View>
            ))}
          </View>
          
          {subCategories.length > 0 ? (
            <View style={styles.list}>
              {subCategories.map((subCategory) => (
                <TouchableOpacity
                  key={subCategory.id}
                  style={styles.categoryRow}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(tabs)/(catalog)/${subCategory.id}`)}
                >
                  <View style={styles.iconContainer}>
                    <Text style={styles.icon}>📦</Text>
                  </View>
                  <Text style={styles.categoryName}>{subCategory.name}</Text>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : offers.length > 0 ? (
            <View style={styles.offersSection}>
              <Text style={styles.offersTitle}>Товары со скидкой ({offers.length})</Text>
              <View style={styles.offersGrid}>
                {offers.map((offer) => (
                  <VerticalOfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                В категории "{category.name}" пока нет товаров со скидкой
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  breadcrumbs: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginBottom: 16,
    paddingVertical: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  breadcrumbSeparator: {
    marginHorizontal: 8,
    color: '#999',
    fontSize: 14,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#666',
  },
  breadcrumbActive: {
    color: '#333',
    fontWeight: '600' as const,
  },
  list: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    height: ROW_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: ROW_HEIGHT * 0.14,
    paddingHorizontal: ROW_HEIGHT * 0.2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: ROW_HEIGHT * 0.6,
    height: ROW_HEIGHT * 0.6,
    borderRadius: ROW_HEIGHT * 0.3,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: ROW_HEIGHT * 0.2,
  },
  icon: {
    fontSize: ROW_HEIGHT * 0.4,
  },
  categoryName: {
    flex: 1,
    fontSize: ROW_HEIGHT * 0.23,
    fontWeight: '600' as const,
    color: '#333',
  },
  arrow: {
    fontSize: ROW_HEIGHT * 0.5,
    color: '#999',
    fontWeight: '300' as const,
  },
  emptyContainer: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  offersSection: {
    gap: 12,
  },
  offersTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 12,
  },
  offersGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
});


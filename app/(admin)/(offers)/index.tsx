import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCategories } from "@/hooks/useCategories";
import { Offer, useOffers } from "@/hooks/useOffers";
import { useShops } from "@/hooks/useShops";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type GroupBy = 'shop' | 'category';

export default function OffersScreen() {
    const { shops, loading: shopsLoading, error: shopsError, refetch: refetchShops } = useShops();
    const { categories, getCategoryById, loading: categoriesLoading, refetch: refetchCategories } = useCategories();
    const { offers, loading: offersLoading, error: offersError, refetch: refetchOffers } = useOffers();
    const [expandedItems, setExpandedItems] = useState<number[]>([]);
    const [groupBy, setGroupBy] = useState<GroupBy>('shop');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedShopIds, setSelectedShopIds] = useState<number[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

    // Функция для обновления всех данных
    const handleRefresh = async () => {
        await Promise.all([
            refetchShops(),
            refetchCategories(),
            refetchOffers(),
        ]);
    };

    // Фильтрация предложений
    const filteredOffers = offers.filter(offer => {
        if (selectedShopIds.length > 0 && !selectedShopIds.includes(offer.shopId)) {
            return false;
        }
        if (selectedCategoryIds.length > 0) {
            // Проверяем, пересекается ли хотя бы одна категория товара с выбранными
            const hasMatchingCategory = offer.productCategoryIds.some(catId => 
                selectedCategoryIds.includes(catId)
            );
            if (!hasMatchingCategory) {
                return false;
            }
        }
        return true;
    });

    const handleToggleItem = (itemId: number) => {
        setExpandedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleAddOffer = (shopId: number) => {
        router.push(`/(admin)/(offers)/new?shopId=${shopId}`);
    };

    const handleOfferPress = (offerId: number) => {
        router.push(`/(admin)/(offers)/${offerId}`);
    };

    const getOffersForGroup = (groupId: number) => {
        if (groupBy === 'shop') {
            return filteredOffers.filter(offer => offer.shopId === groupId);
        } else {
            // Для категорий проверяем, содержит ли оффер эту категорию
            return filteredOffers.filter(offer => offer.productCategoryIds.includes(groupId));
        }
    };


    const handleToggleShopFilter = (shopId: number) => {
        setSelectedShopIds(prev =>
            prev.includes(shopId)
                ? prev.filter(id => id !== shopId)
                : [...prev, shopId]
        );
    };

    const handleToggleCategoryFilter = (categoryId: number) => {
        setSelectedCategoryIds(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleClearFilters = () => {
        setSelectedShopIds([]);
        setSelectedCategoryIds([]);
    };

    const hasActiveFilters = selectedShopIds.length > 0 || selectedCategoryIds.length > 0;

    // Получение групп для отображения
    const getGroups = () => {
        if (groupBy === 'shop') {
            return shops.map(shop => ({
                id: shop.id,
                name: shop.fullName || shop.name,
                subtitle: shop.address,
            }));
        } else {
            // Получаем только категории, которые есть в предложениях
            const categoryIds = new Set<number>();
            filteredOffers.forEach(offer => {
                offer.productCategoryIds.forEach(catId => categoryIds.add(catId));
            });
            
            return Array.from(categoryIds)
                .map(catId => {
                    const category = getCategoryById(catId);
                    return category ? {
                        id: catId,
                        name: category.name,
                        subtitle: `Категория`,
                    } : null;
                })
                .filter((g): g is NonNullable<typeof g> => g !== null);
        }
    };

    const groups = getGroups();

    return (
        <TabScreen 
            title="Предложения"
            onRefresh={handleRefresh}
            refreshing={offersLoading || shopsLoading}
        >
            <View style={styles.container}>
                {/* Заголовок с кнопками */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>
                            {groupBy === 'shop' ? 'По торговым точкам' : 'По категориям'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            Всего предложений: {filteredOffers.length}
                        </Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
                            onPress={() => setShowFilters(true)}
                        >
                            <IconSymbol name="filter" size={20} color={hasActiveFilters ? "#fff" : "#007AFF"} />
                            {hasActiveFilters && (
                                <View style={styles.filterBadge}>
                                    <Text style={styles.filterBadgeText}>
                                        {selectedShopIds.length + selectedCategoryIds.length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Переключатель группировки */}
                <View style={styles.groupToggle}>
                    <TouchableOpacity
                        style={[styles.groupToggleButton, groupBy === 'shop' && styles.groupToggleButtonActive]}
                        onPress={() => setGroupBy('shop')}
                    >
                        <IconSymbol
                            name="map.pin.fill"
                            size={18}
                            color={groupBy === 'shop' ? "#fff" : "#007AFF"}
                        />
                        <Text style={[styles.groupToggleText, groupBy === 'shop' && styles.groupToggleTextActive]}>
                            По точкам
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.groupToggleButton, groupBy === 'category' && styles.groupToggleButtonActive]}
                        onPress={() => setGroupBy('category')}
                    >
                        <IconSymbol
                            name="list.bullet"
                            size={18}
                            color={groupBy === 'category' ? "#fff" : "#007AFF"}
                        />
                        <Text style={[styles.groupToggleText, groupBy === 'category' && styles.groupToggleTextActive]}>
                            По категориям
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Список групп с предложениями */}
                <ScrollView style={styles.scrollView}>
                    {shopsLoading || categoriesLoading || offersLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>Загрузка данных...</Text>
                        </View>
                    ) : shopsError || offersError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorIcon}>⚠️</Text>
                            <Text style={styles.errorText}>
                                {shopsError || offersError || 'Ошибка загрузки данных'}
                            </Text>
                            <Text style={styles.errorSubtext}>
                                {shopsError || offersError}
                            </Text>
                        </View>
                    ) : groups.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={styles.emptyStateText}>Нет данных для отображения</Text>
                        </View>
                    ) : (
                        groups.map(group => {
                        const offers = getOffersForGroup(group.id);
                        const isExpanded = expandedItems.includes(group.id);

                        return (
                            <View key={group.id} style={styles.groupCard}>
                                {/* Заголовок группы */}
                                <View style={styles.groupHeader}>
                                    <TouchableOpacity
                                        style={styles.groupHeaderLeft}
                                        onPress={() => handleToggleItem(group.id)}
                                    >
                                        <IconSymbol
                                            name={isExpanded ? "chevron.down" : "chevron.right"}
                                            size={20}
                                            color="#007AFF"
                                        />
                                        <View style={styles.groupInfo}>
                                            <Text style={styles.groupName}>{group.name}</Text>
                                            <Text style={styles.groupSubtitle}>{group.subtitle}</Text>
                                            <Text style={styles.offersCount}>
                                                {offers.length} {offers.length === 1 ? 'предложение' : 'предложений'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>

                                    {groupBy === 'shop' && (
                                        <TouchableOpacity
                                            style={styles.addButton}
                                            onPress={() => handleAddOffer(group.id)}
                                        >
                                            <IconSymbol name="plus" size={20} color="#007AFF" />
                                            <Text style={styles.addButtonText}>Добавить</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Список предложений (раскрывается) */}
                                {isExpanded && (
                                    <View style={styles.offersList}>
                                        {offers.length === 0 ? (
                                            <Text style={styles.emptyText}>
                                                Нет предложений
                                            </Text>
                                        ) : (
                                            offers.map((offer: Offer) => {
                                                const shop = shops.find(s => s.id === offer.shopId);
                                                // Берем первую категорию для отображения
                                                const firstCategoryId = offer.productCategoryIds[0];
                                                const category = firstCategoryId ? getCategoryById(firstCategoryId) : null;

                                                return (
                                                    <TouchableOpacity
                                                        key={offer.id}
                                                        style={styles.offerCard}
                                                        onPress={() => handleOfferPress(offer.id)}
                                                    >
                                                        <View style={styles.offerLeft}>
                                                            <Text style={styles.offerProductName}>
                                                                {offer.productName}
                                                            </Text>
                                                            {groupBy === 'category' && shop && (
                                                                <Text style={styles.offerShopName}>
                                                                    📍 {shop.fullName || shop.name}
                                                                </Text>
                                                            )}
                                                            {groupBy === 'shop' && category && (
                                                                <Text style={styles.offerCategoryName}>
                                                                    🏷️ {category.name}
                                                                </Text>
                                                            )}
                                                            <View style={styles.offerDetails}>
                                                                <Text style={styles.offerDetailText}>
                                                                    Количество: {offer.count} шт
                                                                </Text>
                                                                <Text style={styles.offerDetailText}>
                                                                    Годен до: {new Date(offer.expiresDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.offerRight}>
                                                            {offer.discount > 0 ? (
                                                                <>
                                                                    <Text style={styles.oldPrice}>
                                                                        {offer.originalCost.toFixed(2)} ₽
                                                                    </Text>
                                                                    <Text style={styles.newPrice}>
                                                                        {offer.currentCost.toFixed(2)} ₽
                                                                    </Text>
                                                                    <View style={styles.discountBadge}>
                                                                        <Text style={styles.discountText}>
                                                                            -{offer.discount}%
                                                                        </Text>
                                                                    </View>
                                                                </>
                                                            ) : (
                                                                <Text style={styles.price}>
                                                                    {offer.currentCost.toFixed(2)} ₽
                                                                </Text>
                                                            )}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </View>
                                )}
                            </View>
                        );
                    })
                    )}
                </ScrollView>
            </View>

            {/* Модальное окно фильтров */}
            <Modal
                visible={showFilters}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowFilters(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFilters(false)}
                >
                    <TouchableOpacity
                        style={styles.filterModal}
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        {/* Заголовок модалки */}
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Фильтры</Text>
                            <TouchableOpacity onPress={() => setShowFilters(false)}>
                                <IconSymbol name="xmark" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.filterContent}>
                            {/* Фильтр по магазинам */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Торговые точки</Text>
                                {shops.map(shop => (
                                    <TouchableOpacity
                                        key={shop.id}
                                        style={styles.filterItem}
                                        onPress={() => handleToggleShopFilter(shop.id)}
                                    >
                                        <View style={styles.filterItemLeft}>
                                            <Text style={styles.filterItemName}>{shop.name}</Text>
                                            <Text style={styles.filterItemSubtitle}>{shop.address}</Text>
                                        </View>
                                        <View style={[
                                            styles.checkbox,
                                            selectedShopIds.includes(shop.id) && styles.checkboxChecked
                                        ]}>
                                            {selectedShopIds.includes(shop.id) && (
                                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Фильтр по категориям */}
                            <View style={styles.filterSection}>
                                <Text style={styles.filterSectionTitle}>Категории</Text>
                                {categories.filter(c => c.parent_category_id === null).map(category => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={styles.filterItem}
                                        onPress={() => handleToggleCategoryFilter(category.id)}
                                    >
                                        <Text style={styles.filterItemName}>{category.name}</Text>
                                        <View style={[
                                            styles.checkbox,
                                            selectedCategoryIds.includes(category.id) && styles.checkboxChecked
                                        ]}>
                                            {selectedCategoryIds.includes(category.id) && (
                                                <IconSymbol name="checkmark" size={16} color="#fff" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Кнопки действий */}
                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleClearFilters}
                            >
                                <Text style={styles.clearButtonText}>Очистить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={() => setShowFilters(false)}
                            >
                                <Text style={styles.applyButtonText}>Применить</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    filterBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    groupToggle: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: '#fff',
    },
    groupToggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#fff',
    },
    groupToggleButtonActive: {
        backgroundColor: '#007AFF',
    },
    groupToggleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
    },
    groupToggleTextActive: {
        color: '#fff',
    },
    groupCard: {
        backgroundColor: '#fff',
        marginTop: 12,
        marginHorizontal: 12,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    groupHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupInfo: {
        marginLeft: 12,
        flex: 1,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    groupSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    offersCount: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    offersList: {
        padding: 12,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        paddingVertical: 20,
        fontStyle: 'italic',
    },
    offerCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fafafa',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    offerLeft: {
        flex: 1,
        marginRight: 12,
    },
    offerProductName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    offerShopName: {
        fontSize: 13,
        color: '#007AFF',
        marginBottom: 4,
    },
    offerCategoryName: {
        fontSize: 13,
        color: '#FF9500',
        marginBottom: 4,
    },
    offerDetails: {
        gap: 2,
    },
    offerDetailText: {
        fontSize: 12,
        color: '#666',
    },
    offerRight: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    oldPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
        marginBottom: 2,
    },
    newPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4CAF50',
        marginBottom: 4,
    },
    discountBadge: {
        backgroundColor: '#FF5252',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    // Стили модального окна
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    filterModal: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    filterContent: {
        maxHeight: 400,
    },
    filterSection: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    filterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    filterItemLeft: {
        flex: 1,
    },
    filterItemName: {
        fontSize: 15,
        color: '#333',
        marginBottom: 2,
    },
    filterItemSubtitle: {
        fontSize: 13,
        color: '#666',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    clearButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#007AFF',
        alignItems: 'center',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    applyButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
    },
});

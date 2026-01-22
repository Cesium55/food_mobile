import { OfferDetailContent } from "@/app/(admin)/(offers)/[id]";
import { NewOfferContent } from "@/app/(admin)/(offers)/new";
import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useModal } from "@/contexts/ModalContext";
import { useCategories } from "@/hooks/useCategories";
import { Offer, useOffers } from "@/hooks/useOffers";
import { useProducts } from "@/hooks/useProducts";
import { useSellerMe } from "@/hooks/useSeller";
import { useShops } from "@/hooks/useShops";
import { getImageUrl } from "@/utils/imageUtils";
import { getCurrentPrice } from "@/utils/pricingUtils";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface GroupedOffer {
    shopId: number;
    shopName: string;
    offers: Offer[];
}

export default function OffersScreen() {
    const { seller } = useSellerMe();
    const { shops, loading: shopsLoading, refetch: refetchShops } = useShops(seller?.id);
    const { loading: categoriesLoading } = useCategories();
    const { offers, loading: offersLoading, error: offersError, fetchOffersForAdmin } = useOffers();
    const { openModal, closeModal } = useModal();
    const { products, refetch: refetchProducts } = useProducts(seller?.id);
    
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (seller?.id) {
            fetchOffersForAdmin(seller.id);
        }
    }, [seller?.id, fetchOffersForAdmin]);

    // Обогащаем офферы категориями
    const enrichedOffers = useMemo(() => {
        return offers.map(offer => {
            if (offer.productCategoryIds && offer.productCategoryIds.length > 0) {
                return offer;
            }
            const product = products.find(p => p.id === offer.productId);
            if (product && product.category_ids && product.category_ids.length > 0) {
                return { ...offer, productCategoryIds: product.category_ids };
            }
            return offer;
        });
    }, [offers, products]);

    // Фильтрация (автоматически исключаем просроченные + поиск + фильтр по продавцу)
    const filteredOffers = useMemo(() => {
        const now = new Date();
        return enrichedOffers.filter(offer => {
            // Фильтр по продавцу - только текущего продавца
            if (seller?.id && offer.sellerId !== seller.id) {
                return false;
            }
            
            // Автоматический фильтр просроченных
            const expiryDate = new Date(offer.expiresDate);
            if (expiryDate < now) return false;

            // Поиск
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!offer.productName.toLowerCase().includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [enrichedOffers, searchQuery, seller?.id]);

    // Сортировка по дате (по умолчанию)
    const sortedOffers = useMemo(() => {
        const sorted = [...filteredOffers];
        sorted.sort((a, b) => {
            return new Date(b.expiresDate).getTime() - new Date(a.expiresDate).getTime();
        });
        return sorted;
    }, [filteredOffers]);

    // Группировка по магазинам
    const groupedOffers = useMemo(() => {
        const groups: { [key: number]: Offer[] } = {};
        
        sortedOffers.forEach(offer => {
            const shopId = Number(offer.shopId);
            if (!groups[shopId]) {
                groups[shopId] = [];
            }
            groups[shopId].push(offer);
        });

        return Object.keys(groups).map(shopId => {
            const id = Number(shopId);
            const shop = shops.find(s => s.id === id);
            return {
                shopId: id,
                shopName: shop?.address || shop?.fullName || shop?.name || `Магазин #${id}`,
                offers: groups[id],
            };
        }).sort((a, b) => a.shopName.localeCompare(b.shopName));
    }, [sortedOffers, shops]);

    const handleOfferPress = (offerId: number) => {
        openModal(<OfferDetailContent offerId={offerId} onClose={closeModal} />);
    };

    const handleAddOffer = () => {
        const targetShop = shops[0];
        if (targetShop) {
            openModal(<NewOfferContent shopId={targetShop.id} onClose={closeModal} />);
        } else {
            // Если магазинов нет, открываем модалку без предустановленного магазина
            openModal(<NewOfferContent onClose={closeModal} />);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            if (seller?.id) {
                await Promise.all([
                    fetchOffersForAdmin(seller.id),
                    refetchProducts(),
                    refetchShops(),
                ]);
            }
        } finally {
            setRefreshing(false);
        }
    };


    if (offersLoading || shopsLoading || categoriesLoading) {
        return (
            <TabScreen title="Предложения">
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#666' }}>Загрузка данных...</Text>
                </View>
            </TabScreen>
        );
    }

    if (offersError) {
        return (
            <TabScreen title="Предложения">
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 16, color: '#ff3b30' }}>{offersError}</Text>
                </View>
            </TabScreen>
        );
    }

    return (
        <TabScreen title="Предложения">
            <View style={styles.container}>
                {/* Заголовок и кнопки */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Предложения сети
                    </Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddOffer}
                            activeOpacity={0.7}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <IconSymbol name="plus" size={20} color="#fff" />
                            <Text style={styles.addButtonText}>Добавить</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Поиск */}
                <View style={styles.searchContainer}>
                    <IconSymbol name="search" size={20} color="#666" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Поиск предложений..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <IconSymbol name="xmark" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Список предложений */}
                <ScrollView 
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor="#34C759"
                            colors={["#34C759"]}
                        />
                    }
                >
                    <Text style={styles.countText}>
                        Всего предложений: {sortedOffers.length}
                    </Text>

                    {groupedOffers.length > 0 && (
                        <>
                            {groupedOffers.map((group) => (
                                <View key={group.shopId} style={styles.shopSection}>
                                    <View style={styles.shopHeader}>
                                        <Text style={styles.shopName}>{group.shopName}</Text>
                                        <Text style={styles.shopCount}>
                                            {group.offers.length}
                                        </Text>
                                    </View>
                                    {group.offers.map((offer) => {
                                        const firstImage = offer.productImages?.[0];
                                        const imageUrl = firstImage ? getImageUrl(firstImage.path) : null;
                                        const currentPriceStr = getCurrentPrice(offer);
                                        const currentPrice = currentPriceStr ? parseFloat(currentPriceStr) : null;
                                        const originalCost = offer.originalCost ? (typeof offer.originalCost === 'string' ? parseFloat(offer.originalCost) : offer.originalCost) : 0;
                                        const discount = currentPrice && originalCost > 0 ? Math.round(((originalCost - currentPrice) / originalCost) * 100) : 0;

                                        return (
                                            <TouchableOpacity
                                                key={offer.id}
                                                style={styles.offerRow}
                                                activeOpacity={0.7}
                                                onPress={() => handleOfferPress(offer.id)}
                                            >
                                                <View style={styles.offerIcon}>
                                                    {imageUrl ? (
                                                        <Image source={{ uri: imageUrl }} style={styles.offerImage} resizeMode="cover" />
                                                    ) : (
                                                        <View style={styles.offerIconPlaceholder}>
                                                            <IconSymbol name="photo" size={24} color="#999" />
                                                        </View>
                                                    )}
                                                </View>
                                                
                                                <View style={styles.offerInfo}>
                                                    <Text style={styles.offerName}>{offer.productName}</Text>
                                                    <View style={styles.offerPriceRow}>
                                                        {currentPrice ? (
                                                            <>
                                                                {discount > 0 ? (
                                                                    <>
                                                                        <Text style={styles.offerPriceOriginal}>
                                                                            {originalCost.toFixed(2)} ₽
                                                                        </Text>
                                                                        <Text style={styles.offerPrice}>
                                                                            {currentPrice.toFixed(2)} ₽
                                                                        </Text>
                                                                        <View style={styles.discountBadge}>
                                                                            <Text style={styles.discountBadgeText}>-{discount}%</Text>
                                                                        </View>
                                                                    </>
                                                                ) : (
                                                                    <Text style={styles.offerPrice}>
                                                                        {currentPrice.toFixed(2)} ₽
                                                                    </Text>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Text style={styles.offerPriceExpired}>—</Text>
                                                        )}
                                                    </View>
                                                    <View style={styles.offerDetails}>
                                                        <Text style={styles.offerDetailText}>
                                                            {new Date(offer.expiresDate).toLocaleDateString('ru-RU', { 
                                                                day: '2-digit', 
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </Text>
                                                        <Text style={styles.offerDetailText}>
                                                            {offer.count} шт
                                                        </Text>
                                                    </View>
                                                </View>

                                                <IconSymbol name="chevron.right" color="#999" size={20} />
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </>
                    )}

                    {groupedOffers.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery
                                    ? "Предложения не найдены"
                                    : "Нет предложений"}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {searchQuery
                                    ? "Попробуйте изменить поисковый запрос"
                                    : "Нажмите 'Добавить' чтобы создать первое предложение"}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#34C759',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 8,
        margin: 16,
        marginBottom: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    scrollContent: {
        paddingTop: 8,
        paddingBottom: 40,
        paddingHorizontal: 0,
    },
    countText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        fontStyle: 'italic',
        paddingHorizontal: 16,
    },
    shopSection: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        overflow: 'hidden',
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    shopName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    shopCount: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    offerRow: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    offerIcon: {
        width: 50,
        height: 50,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    offerImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
    },
    offerIconPlaceholder: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    offerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    offerPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    offerPriceOriginal: {
        fontSize: 13,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    offerPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#34C759',
    },
    discountBadge: {
        backgroundColor: '#34C759',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    offerPriceExpired: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF3B30',
    },
    offerDetails: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 2,
    },
    offerDetailText: {
        fontSize: 13,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});

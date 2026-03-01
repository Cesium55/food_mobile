import { ScreenWrapper } from "@/components/screen/ScreenWrapper";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Offer, useOffers } from "@/hooks/useOffers";
import { usePricingStrategies } from "@/hooks/usePricingStrategies";
import { useSellerMe } from "@/hooks/useSeller";
import { useShops } from "@/hooks/useShops";
import { getImageUrl } from "@/utils/imageUtils";
import { getCurrentPrice } from "@/utils/pricingUtils";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OfferDetailScreenProps {
    offerId?: number;
    onClose?: () => void;
}


export function OfferDetailContent({ offerId: offerIdProp, onClose }: OfferDetailScreenProps) {
    const { id } = useLocalSearchParams();
    const offerId = offerIdProp ?? (typeof id === 'string' ? parseInt(id) : 0);
    const { shops, loading: shopsLoading } = useShops();
    const { getOfferById, loading: offersLoading, updateOffer, fetchOffers, offers } = useOffers();
    const { strategies, loading: strategiesLoading } = usePricingStrategies();
    const { seller } = useSellerMe();
    
    const [offer, setOffer] = useState<Offer | null>(null);
    const [loadingOffer, setLoadingOffer] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [pricingMode, setPricingMode] = useState<'fixed' | 'strategy'>('fixed');
    const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
    const [showStrategyPicker, setShowStrategyPicker] = useState(false);
    
    const [editedOffer, setEditedOffer] = useState<{
        originalCost: string;
        currentCost: string | null;
        count: number;
        expiresDate: string;
        description?: string;
    } | null>(null);
    
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imagesScrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        if (!offerId) {
            setLoadingOffer(false);
            return;
        }
        
        const foundOffer = getOfferById(offerId);
        if (foundOffer) {
            setOffer(foundOffer);
            setLoadingOffer(false);
            return;
        }
        
        if (seller?.id && !offersLoading) {
            setLoadingOffer(true);
            fetchOffers({ skipDefaultFilters: true, sellerId: seller.id, preserveExisting: true }).then(() => {
                const loadedOffer = getOfferById(offerId);
                if (loadedOffer) {
                    setOffer(loadedOffer);
                }
                setLoadingOffer(false);
            }).catch(() => {
                setLoadingOffer(false);
            });
        } else if (!offersLoading) {
            setLoadingOffer(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [offerId, offers.length, seller?.id, offersLoading]);

    useEffect(() => {
        if (offer) {
            const isDynamic = offer.isDynamicPricing || !!offer.pricingStrategyId;
            setPricingMode(isDynamic ? 'strategy' : 'fixed');
            setSelectedStrategyId(offer.pricingStrategyId ?? null);
            setEditedOffer({
                originalCost: offer.originalCost,
                currentCost: offer.currentCost,
                count: offer.count,
                expiresDate: offer.expiresDate.split('T')[0],
                description: offer.description,
            });
        }
    }, [offer]);

    const handleClose = onClose ?? (() => router.back());

    if (offersLoading || shopsLoading || loadingOffer) {
        return (
            <ScreenWrapper title="Предложение" useScrollView={false}>
                <View style={styles.modalContainer}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Загрузка данных...</Text>
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    if (!offer && !loadingOffer && !offersLoading) {
        return (
            <ScreenWrapper title="Предложение" useScrollView={false}>
                <View style={styles.modalContainer}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>Предложение не найдено</Text>
                        <TouchableOpacity style={styles.backButton} onPress={handleClose}>
                            <Text style={styles.backButtonText}>Вернуться назад</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScreenWrapper>
        );
    }

    if (!offer) return null;

    const shop = shops.find(s => s.id === offer.shopId);
    const now = new Date();
    const expiryDate = new Date(offer.expiresDate);
    const isExpired = expiryDate < now;
    const currentPriceStr = getCurrentPrice(offer);
    const currentPrice = currentPriceStr ? parseFloat(currentPriceStr) : null;
    const originalCost = offer.originalCost ? (typeof offer.originalCost === 'string' ? parseFloat(offer.originalCost) : offer.originalCost) : 0;
    const discount = currentPrice && originalCost > 0 ? Math.round(((originalCost - currentPrice) / originalCost) * 100) : 0;

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (hasChanges) {
            Alert.alert(
                "Отменить изменения?",
                "Все несохраненные изменения будут потеряны",
                [
                    { text: "Продолжить редактирование", style: "cancel" },
                    {
                        text: "Отменить",
                        style: "destructive",
                        onPress: () => {
                            setIsEditing(false);
                            setHasChanges(false);
                            if (offer) {
                                const isDynamic = offer.isDynamicPricing || !!offer.pricingStrategyId;
                                setPricingMode(isDynamic ? 'strategy' : 'fixed');
                                setSelectedStrategyId(offer.pricingStrategyId ?? null);
                                setEditedOffer({
                                    originalCost: offer.originalCost,
                                    currentCost: offer.currentCost,
                                    count: offer.count,
                                    expiresDate: offer.expiresDate.split('T')[0],
                                    description: offer.description,
                                });
                            }
                        }
                    }
                ]
            );
        } else {
            setIsEditing(false);
            setActiveTab('info');
        }
    };

    const handleSave = () => {
        if (!editedOffer) return;

        if (pricingMode === 'fixed') {
            const originalCostNum = parseFloat(editedOffer.originalCost);
            if (originalCostNum <= 0) {
                Alert.alert("Ошибка", "Цена должна быть больше 0");
                return;
            }
            if (editedOffer.currentCost !== null) {
                const currentCostNum = parseFloat(editedOffer.currentCost);
                if (currentCostNum < 0 || currentCostNum > originalCostNum) {
                    Alert.alert("Ошибка", "Цена со скидкой должна быть от 0 до оригинальной цены");
                    return;
                }
            }
        } else {
            if (!selectedStrategyId) {
                Alert.alert("Ошибка", "Выберите стратегию ценообразования");
                return;
            }
        }

        if (editedOffer.count <= 0) {
            Alert.alert("Ошибка", "Количество должно быть больше 0");
            return;
        }

        Alert.alert(
            "Сохранить изменения?",
            "Изменения будут применены к предложению",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Сохранить",
                    onPress: async () => {
                        try {
                            let expiresDateTime: string;
                            if (editedOffer.expiresDate) {
                                if (/^\d{4}-\d{2}-\d{2}$/.test(editedOffer.expiresDate)) {
                                    const date = new Date(editedOffer.expiresDate + 'T23:59:59');
                                    expiresDateTime = date.toISOString();
                                } else {
                                    const date = new Date(editedOffer.expiresDate);
                                    date.setHours(23, 59, 59, 999);
                                    expiresDateTime = date.toISOString();
                                }
                            } else {
                                expiresDateTime = editedOffer.expiresDate;
                            }

                            const updateData: {
                                pricing_strategy_id?: number | null;
                                current_cost?: string | null;
                                original_cost?: string;
                                count?: number;
                                expires_date?: string;
                                description?: string;
                            } = {
                                count: editedOffer.count,
                                expires_date: expiresDateTime,
                                description: editedOffer.description,
                            };

                            if (pricingMode === 'strategy') {
                                updateData.pricing_strategy_id = selectedStrategyId;
                                updateData.current_cost = null;
                                updateData.original_cost = editedOffer.originalCost;
                            } else {
                                updateData.pricing_strategy_id = null;
                                updateData.current_cost = editedOffer.currentCost;
                                updateData.original_cost = editedOffer.originalCost;
                            }

                            await updateOffer(offerId, updateData);
                            
                            Alert.alert("Успех", "Изменения сохранены");
                            setIsEditing(false);
                            setHasChanges(false);
                            const updatedOffer = getOfferById(offerId);
                            if (updatedOffer) {
                                setOffer(updatedOffer);
                            }
                        } catch (error: any) {
                            console.error('Ошибка обновления оффера:', error);
                            Alert.alert(
                                "Ошибка",
                                error.message || "Не удалось сохранить изменения. Попробуйте еще раз."
                            );
                        }
                    }
                }
            ]
        );
    };

    const handleFieldChange = <K extends keyof typeof editedOffer>(
        field: K,
        value: typeof editedOffer[K]
    ) => {
        if (editedOffer) {
            setEditedOffer({ ...editedOffer, [field]: value });
            setHasChanges(true);
        }
    };

    const displayOffer = editedOffer || {
        originalCost: offer.originalCost,
        currentCost: offer.currentCost,
        count: offer.count,
        expiresDate: offer.expiresDate.split('T')[0],
        description: offer.description,
    };

    return (
        <ScreenWrapper title={`Предложение #${offer.id}`} useScrollView={false}>
            <View style={styles.modalContainer}>
                <View style={styles.inlineHeaderActions}>
                    <View style={styles.headerLeft}>
                        {isExpired && (
                            <View style={styles.expiredBadge}>
                                <Text style={styles.expiredBadgeText}>Просрочено</Text>
                            </View>
                        )}
                        {offer.isDynamicPricing && !isExpired && (
                            <View style={styles.dynamicBadge}>
                                <Text style={styles.dynamicBadgeText}>⚡ Динамическая</Text>
                            </View>
                        )}
                    </View>
                    {!isEditing ? (
                        <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                            <IconSymbol name="pencil" size={18} color="#007AFF" />
                            <Text style={styles.editButtonText}>Редактировать</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>Отмена</Text>
                        </TouchableOpacity>
                    )}
                </View>

            {/* Контент */}
            {!isEditing ? (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Изображения */}
                    {offer.productImages && offer.productImages.length > 0 && (
                        <View style={styles.imagesSection}>
                            <ScrollView 
                                ref={imagesScrollRef}
                                horizontal 
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
                                    const scrollPosition = event.nativeEvent.contentOffset.x;
                                    const imageWidth = SCREEN_WIDTH - 32; // ширина изображения
                                    const index = Math.round(scrollPosition / imageWidth);
                                    setCurrentImageIndex(index);
                                }}
                                scrollEventThrottle={16}
                                contentContainerStyle={styles.imagesScrollContent}
                            >
                                {offer.productImages.map((image, index) => {
                                    const imageUrl = getImageUrl(image.path);
                                    return (
                                        <View key={image.id || index} style={styles.imageWrapper}>
                                            {imageUrl ? (
                                                <Image
                                                    source={{ uri: imageUrl }}
                                                    style={styles.productImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={[styles.productImage, styles.imagePlaceholder]}>
                                                    <Text style={styles.imagePlaceholderText}>📸</Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                            {offer.productImages.length > 1 && (
                                <View style={styles.imageIndicators}>
                                    {offer.productImages.map((_, index) => (
                                        <View
                                            key={index}
                                            style={[
                                                styles.indicatorDot,
                                                index === currentImageIndex && styles.indicatorDotActive
                                            ]}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Цена и скидка */}
                    <View style={styles.priceSection}>
                        <View style={styles.priceCard}>
                            <Text style={styles.priceLabel}>Текущая цена</Text>
                            {currentPrice && !isExpired ? (
                                <>
                                    <Text style={styles.priceValue}>{currentPrice.toFixed(2)} ₽</Text>
                                    {originalCost > currentPrice && (
                                        <View style={styles.discountInfo}>
                                            <Text style={styles.originalPrice}>{originalCost.toFixed(2)} ₽</Text>
                                            <View style={styles.discountBadge}>
                                                <Text style={styles.discountBadgeText}>-{discount}%</Text>
                                            </View>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <Text style={styles.expiredPriceText}>Просрочен</Text>
                            )}
                        </View>
                        {offer.isDynamicPricing && offer.pricingStrategy && (
                            <View style={styles.strategyCard}>
                                <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#007AFF" />
                                <View style={styles.strategyInfo}>
                                    <Text style={styles.strategyLabel}>Стратегия</Text>
                                    <Text style={styles.strategyName}>{offer.pricingStrategy.name}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Основная информация */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Основная информация</Text>
                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <IconSymbol name="number.circle.fill" size={20} color="#007AFF" />
                                <View style={styles.infoItemContent}>
                                    <Text style={styles.infoLabel}>Количество</Text>
                                    <Text style={styles.infoValue}>{offer.count} шт</Text>
                                </View>
                            </View>
                            <View style={styles.infoItem}>
                                <IconSymbol name="calendar" size={20} color="#FF9500" />
                                <View style={styles.infoItemContent}>
                                    <Text style={styles.infoLabel}>Срок годности</Text>
                                    <Text style={styles.infoValue}>
                                        {new Date(offer.expiresDate).toLocaleDateString('ru-RU', { 
                                            day: '2-digit', 
                                            month: '2-digit', 
                                            year: 'numeric' 
                                        })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Товар */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Товар</Text>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Название</Text>
                            <Text style={styles.detailValue}>{offer.productName}</Text>
                        </View>
                        {offer.productDescription && (
                            <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Описание</Text>
                                <Text style={styles.detailValue}>{offer.productDescription}</Text>
                            </View>
                        )}
                    </View>

                    {/* Торговая точка */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Торговая точка</Text>
                        <View style={styles.detailCard}>
                            <Text style={styles.detailLabel}>Название</Text>
                            <Text style={styles.detailValue}>
                                {shop?.fullName || shop?.name || `Точка #${offer.shopId}`}
                            </Text>
                        </View>
                        {shop?.address && (
                            <View style={styles.detailCard}>
                                <Text style={styles.detailLabel}>Адрес</Text>
                                <Text style={styles.detailValue}>{shop.address}</Text>
                            </View>
                        )}
                    </View>

                    {/* Примечание */}
                    {offer.description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Примечание</Text>
                            <View style={styles.detailCard}>
                                <Text style={styles.detailValue}>{offer.description}</Text>
                            </View>
                        </View>
                    )}

                    {/* Кнопка удаления */}
                    <View style={styles.dangerSection}>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => {
                            Alert.alert(
                                "Удалить предложение?",
                                "Это действие нельзя будет отменить",
                                [
                                    { text: "Отмена", style: "cancel" },
                                    {
                                        text: "Удалить",
                                        style: "destructive",
                                        onPress: () => {
                                            Alert.alert("Успех", "Предложение удалено");
                                            handleClose();
                                        }
                                    }
                                ]
                            );
                        }}>
                            <IconSymbol name="trash" size={20} color="#fff" />
                            <Text style={styles.deleteButtonText}>Удалить предложение</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            ) : (
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Режим ценообразования */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Режим ценообразования</Text>
                        <View style={styles.segmentedControl}>
                            <TouchableOpacity
                                style={[styles.segment, pricingMode === 'fixed' && styles.segmentActive]}
                                onPress={() => {
                                    setPricingMode('fixed');
                                    setSelectedStrategyId(null);
                                    if (editedOffer) {
                                        setEditedOffer({
                                            ...editedOffer,
                                            currentCost: editedOffer.currentCost ?? editedOffer.originalCost,
                                        });
                                    }
                                    setHasChanges(true);
                                }}
                            >
                                <Text style={[styles.segmentText, pricingMode === 'fixed' && styles.segmentTextActive]}>
                                    Фиксированная цена
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.segment, pricingMode === 'strategy' && styles.segmentActive]}
                                onPress={() => {
                                    setPricingMode('strategy');
                                    if (editedOffer) {
                                        setEditedOffer({ ...editedOffer, currentCost: null });
                                    }
                                    setHasChanges(true);
                                }}
                            >
                                <Text style={[styles.segmentText, pricingMode === 'strategy' && styles.segmentTextActive]}>
                                    Стратегия
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Поля для фиксированной цены */}
                    {pricingMode === 'fixed' && (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.inputLabel}>Оригинальная цена, ₽ *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={displayOffer.originalCost ? displayOffer.originalCost.toString() : '0.00'}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        handleFieldChange('originalCost', num.toString());
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                />
                            </View>
                            <View style={styles.section}>
                                <Text style={styles.inputLabel}>Цена со скидкой, ₽ *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={displayOffer.currentCost ?? '0.00'}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        handleFieldChange('currentCost', num.toFixed(2));
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                />
                            </View>
                        </>
                    )}

                    {/* Поля для стратегии */}
                    {pricingMode === 'strategy' && (
                        <View style={styles.section}>
                            <Text style={styles.inputLabel}>Стратегия ценообразования *</Text>
                            {!showStrategyPicker ? (
                                <TouchableOpacity
                                    style={styles.strategyInputContainer}
                                    onPress={() => setShowStrategyPicker(true)}
                                >
                                    <Text style={[
                                        styles.strategyInputText,
                                        !selectedStrategyId && styles.strategyInputPlaceholder
                                    ]}>
                                        {selectedStrategyId
                                            ? strategies.find(s => s.id === selectedStrategyId)?.name || 'Не выбрана'
                                            : 'Выберите стратегию'
                                        }
                                    </Text>
                                    <IconSymbol name="chevron.down" size={20} color="#666" />
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.strategySelector}>
                                    <View style={styles.selectorHeader}>
                                        <Text style={styles.selectorTitle}>Выберите стратегию</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowStrategyPicker(false)}
                                            style={styles.closeSelectorButton}
                                        >
                                            <IconSymbol name="xmark" size={20} color="#666" />
                                        </TouchableOpacity>
                                    </View>
                                    {strategiesLoading ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#007AFF" />
                                        </View>
                                    ) : strategies.length === 0 ? (
                                        <View style={styles.emptyContainer}>
                                            <Text style={styles.emptyText}>Нет доступных стратегий</Text>
                                        </View>
                                    ) : (
                                        <ScrollView style={styles.strategiesList}>
                                            {strategies.map(strategy => (
                                                <TouchableOpacity
                                                    key={strategy.id}
                                                    style={[
                                                        styles.strategyItem,
                                                        selectedStrategyId === strategy.id && styles.strategyItemSelected
                                                    ]}
                                                    onPress={() => {
                                                        setSelectedStrategyId(strategy.id);
                                                        setShowStrategyPicker(false);
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <View style={styles.strategyItemContent}>
                                                        <Text style={[
                                                            styles.strategyItemText,
                                                            selectedStrategyId === strategy.id && styles.strategyItemTextSelected
                                                        ]}>
                                                            {strategy.name}
                                                        </Text>
                                                        <Text style={styles.strategyItemSteps}>
                                                            {strategy.steps.length} шаг{strategy.steps.length !== 1 ? 'ов' : ''}
                                                        </Text>
                                                    </View>
                                                    {selectedStrategyId === strategy.id && (
                                                        <IconSymbol name="checkmark.circle.fill" size={24} color="#007AFF" />
                                                    )}
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Количество */}
                    <View style={styles.section}>
                        <Text style={styles.inputLabel}>Количество, шт *</Text>
                        <TextInput
                            style={styles.input}
                            value={displayOffer.count.toString()}
                            onChangeText={(text) => {
                                const num = parseInt(text) || 0;
                                handleFieldChange('count', num);
                            }}
                            keyboardType="number-pad"
                            placeholder="0"
                        />
                    </View>

                    {/* Срок годности */}
                    <View style={styles.section}>
                        <Text style={styles.inputLabel}>Срок годности *</Text>
                        <TextInput
                            style={styles.input}
                            value={displayOffer.expiresDate}
                            onChangeText={(text) => handleFieldChange('expiresDate', text)}
                            placeholder="ГГГГ-ММ-ДД"
                        />
                    </View>

                    {/* Описание */}
                    <View style={styles.section}>
                        <Text style={styles.inputLabel}>Примечание</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={displayOffer.description}
                            onChangeText={(text) => handleFieldChange('description', text)}
                            placeholder="Дополнительная информация"
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    {/* Кнопка сохранения */}
                    <View style={styles.saveSection}>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!hasChanges}
                        >
                            <Text style={styles.saveButtonText}>Сохранить изменения</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
            </View>
        </ScreenWrapper>
    );
}

export default function OfferDetailScreen(props: OfferDetailScreenProps) {
    return <OfferDetailContent {...props} />;
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    inlineHeaderActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    headerLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    expiredBadge: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    expiredBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    dynamicBadge: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dynamicBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    editButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    cancelButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    imagesSection: {
        marginBottom: 24,
        alignItems: 'center',
    },
    imagesScrollContent: {
        alignItems: 'center',
    },
    imageWrapper: {
        width: SCREEN_WIDTH - 32,
    },
    productImage: {
        width: '100%',
        height: 300,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        fontSize: 64,
    },
    imageIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
    },
    indicatorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ccc',
    },
    indicatorDotActive: {
        backgroundColor: '#34C759',
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    priceSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 12,
    },
    priceCard: {
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    priceLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    priceValue: {
        fontSize: 36,
        fontWeight: '700',
        color: '#34C759',
        marginBottom: 8,
    },
    discountInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    originalPrice: {
        fontSize: 18,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        backgroundColor: '#34C759',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    discountBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    expiredPriceText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FF3B30',
    },
    strategyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    strategyInfo: {
        flex: 1,
    },
    strategyLabel: {
        fontSize: 12,
        color: '#007AFF',
        marginBottom: 4,
    },
    strategyName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    infoGrid: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    infoItemContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    detailCard: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    detailLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    detailValue: {
        fontSize: 16,
        color: '#333',
        lineHeight: 22,
    },
    dangerSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    segmentActive: {
        backgroundColor: '#007AFF',
    },
    segmentText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    segmentTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    strategyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#fff',
    },
    strategyInputText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    strategyInputPlaceholder: {
        color: '#999',
    },
    strategySelector: {
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 300,
        marginTop: 8,
    },
    selectorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    selectorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    closeSelectorButton: {
        padding: 4,
    },
    strategiesList: {
        maxHeight: 240,
    },
    strategyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    strategyItemSelected: {
        backgroundColor: '#F5F7FA',
    },
    strategyItemContent: {
        flex: 1,
        marginRight: 12,
    },
    strategyItemText: {
        fontSize: 15,
        color: '#333',
    },
    strategyItemTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
    strategyItemSteps: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    saveSection: {
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
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
    backButton: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});



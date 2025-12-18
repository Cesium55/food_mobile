import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOffers } from "@/hooks/useOffers";
import { usePricingStrategies } from "@/hooks/usePricingStrategies";
import { useShops } from "@/hooks/useShops";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfferDetailScreen() {
    const { id } = useLocalSearchParams();
    const offerId = typeof id === 'string' ? parseInt(id) : 0;
    const { shops, loading: shopsLoading } = useShops();
    const { getOfferById, loading: offersLoading, updateOffer } = useOffers();
    const { strategies, loading: strategiesLoading } = usePricingStrategies();
    
    const offer = getOfferById(offerId);
    const shop = offer ? shops.find(s => s.id === offer.shopId) : null;

    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [pricingMode, setPricingMode] = useState<'fixed' | 'strategy'>('fixed');
    const [selectedStrategyId, setSelectedStrategyId] = useState<number | null>(null);
    const [showStrategyPicker, setShowStrategyPicker] = useState(false);
    
    // Локальное состояние для редактирования
    const [editedOffer, setEditedOffer] = useState<{
        originalCost: string;
        currentCost: string | null;
        count: number;
        expiresDate: string;
        description?: string;
    } | null>(null);

    useEffect(() => {
        if (offer) {
            const isDynamic = offer.isDynamicPricing || !!offer.pricingStrategyId;
            setPricingMode(isDynamic ? 'strategy' : 'fixed');
            setSelectedStrategyId(offer.pricingStrategyId ?? null);
            setEditedOffer({
                originalCost: offer.originalCost,
                currentCost: offer.currentCost,
                count: offer.count,
                expiresDate: offer.expiresDate.split('T')[0], // Форматируем дату для input
                description: offer.description,
            });
        }
    }, [offer]);

    if (offersLoading || shopsLoading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="arrow.left" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Загрузка...</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Загрузка данных...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!offer) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <IconSymbol name="arrow.left" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ошибка</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorText}>Предложение не найдено</Text>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Вернуться назад</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

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
                            // Сбрасываем изменения
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
        }
    };

    const handleSave = () => {
        if (!editedOffer) return;

        // Валидация в зависимости от режима ценообразования
        if (pricingMode === 'fixed') {
            const originalCostNum = parseFloat(editedOffer.originalCost);
            if (originalCostNum <= 0) {
                Alert.alert("Ошибка", "Цена должна быть больше 0");
                return;
            }
            if (editedOffer.currentCost !== null) {
                const currentCostNum = parseFloat(editedOffer.currentCost);
                if (currentCostNum < 0) {
                    Alert.alert("Ошибка", "Цена со скидкой не может быть отрицательной");
                    return;
                }
                if (currentCostNum > originalCostNum) {
                    Alert.alert("Ошибка", "Цена со скидкой не может быть больше оригинальной цены");
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
                            // Преобразуем дату в полный datetime с временем конца дня (23:59:59)
                            let expiresDateTime: string;
                            if (editedOffer.expiresDate) {
                                // Если дата в формате YYYY-MM-DD, добавляем время конца дня
                                if (/^\d{4}-\d{2}-\d{2}$/.test(editedOffer.expiresDate)) {
                                    const date = new Date(editedOffer.expiresDate + 'T23:59:59');
                                    expiresDateTime = date.toISOString();
                                } else {
                                    // Если уже полный datetime, используем как есть
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
                                updateData.current_cost = null; // Для динамического ценообразования current_cost должен быть null
                                updateData.original_cost = editedOffer.originalCost; // Сохраняем базовую цену для расчета скидок
                            } else {
                                updateData.pricing_strategy_id = null;
                                updateData.current_cost = editedOffer.currentCost;
                                updateData.original_cost = editedOffer.originalCost;
                            }

                            await updateOffer(offerId, updateData);
                            
                            Alert.alert("Успех", "Изменения сохранены");
                            setIsEditing(false);
                            setHasChanges(false);
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

    const handleDelete = () => {
        Alert.alert(
            "Удалить предложение?",
            "Это действие нельзя будет отменить",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Удалить",
                    style: "destructive",
                    onPress: async () => {
                        // TODO: Реализовать API запрос для удаления
                        Alert.alert("Успех", "Предложение удалено");
                        router.back();
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

    const getFinalPrice = () => {
        const price = editedOffer?.currentCost ?? offer.currentCost ?? '0.00';
        return parseFloat(price);
    };

    const getDiscount = () => {
        const original = editedOffer?.originalCost ?? offer.originalCost;
        const current = editedOffer?.currentCost ?? offer.currentCost;
        const originalNum = parseFloat(original);
        const currentNum = current !== null ? parseFloat(current) : null;
        if (originalNum > 0 && currentNum !== null) {
            return Math.round(((originalNum - currentNum) / originalNum) * 100);
        }
        return 0;
    };

    const displayOffer = editedOffer || {
        originalCost: offer.originalCost,
        currentCost: offer.currentCost,
        count: offer.count,
        expiresDate: offer.expiresDate.split('T')[0],
        description: offer.description,
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <IconSymbol name="arrow.left" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Предложение #{offer.id}</Text>
                {!isEditing ? (
                    <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
                        <IconSymbol name="pencil" size={20} color="#007AFF" />
                        <Text style={styles.editButtonText}>Редактировать</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Информация о товаре */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Товар</Text>
                    <View style={styles.productCard}>
                        <Text style={styles.productName}>{offer.productName}</Text>
                        <Text style={styles.productId}>ID товара: {offer.productId}</Text>
                        {offer.productDescription && (
                            <Text style={styles.productDescription}>{offer.productDescription}</Text>
                        )}
                    </View>
                </View>

                {/* Торговая точка */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Торговая точка</Text>
                    <View style={styles.shopCard}>
                        <Text style={styles.shopName}>
                            {shop?.fullName || shop?.name || `Точка #${offer.shopId}`}
                        </Text>
                        <Text style={styles.shopId}>ID точки: {offer.shopId}</Text>
                    </View>
                </View>

                {/* Основная информация */}
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Основная информация</Text>

                    {/* Индикатор динамического ценообразования (только для просмотра) */}
                    {!isEditing && offer.isDynamicPricing && (
                        <View style={styles.dynamicPricingBadge}>
                            <IconSymbol name="chart.line.uptrend.xyaxis" size={16} color="#007AFF" />
                            <Text style={styles.dynamicPricingBadgeText}>Динамическое ценообразование</Text>
                            {offer.pricingStrategy && (
                                <Text style={styles.dynamicPricingStrategyName}>
                                    {offer.pricingStrategy.name}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Режим ценообразования (только при редактировании) */}
                    {isEditing && (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Режим ценообразования *</Text>
                            <View style={styles.segmentedControl}>
                                <TouchableOpacity
                                    style={[
                                        styles.segment,
                                        pricingMode === 'fixed' && styles.segmentActive
                                    ]}
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
                                    <Text style={[
                                        styles.segmentText,
                                        pricingMode === 'fixed' && styles.segmentTextActive
                                    ]}>
                                        Фиксированная цена
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.segment,
                                        pricingMode === 'strategy' && styles.segmentActive
                                    ]}
                                    onPress={() => {
                                        setPricingMode('strategy');
                                        if (editedOffer) {
                                            setEditedOffer({
                                                ...editedOffer,
                                                currentCost: null,
                                            });
                                        }
                                        setHasChanges(true);
                                    }}
                                >
                                    <Text style={[
                                        styles.segmentText,
                                        pricingMode === 'strategy' && styles.segmentTextActive
                                    ]}>
                                        Стратегия
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Поля для фиксированной цены */}
                    {(pricingMode === 'fixed' || (!isEditing && !offer.isDynamicPricing)) && (
                        <>
                            {/* Оригинальная цена */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Оригинальная цена, ₽ *</Text>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.input}
                                        value={displayOffer.originalCost.toString()}
                                        onChangeText={(text) => {
                                            const num = parseFloat(text) || 0;
                                            handleFieldChange('originalCost', num);
                                        }}
                                        keyboardType="decimal-pad"
                                        placeholder="0.00"
                                    />
                                ) : (
                                    <View style={styles.valueContainer}>
                                        <Text style={styles.valueText}>
                                            {offer.originalCost.toFixed(2)} ₽
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Цена со скидкой */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Цена со скидкой, ₽ *</Text>
                                {isEditing ? (
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
                                ) : (
                                    <View style={styles.valueContainer}>
                                        <Text style={styles.valueText}>
                                            {offer.currentCost ? offer.currentCost : '—'} ₽
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Скидка */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Скидка</Text>
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>
                                        {getDiscount() > 0 ? `${getDiscount()}%` : 'Без скидки'}
                                    </Text>
                                    {getDiscount() > 0 && displayOffer.currentCost !== null && (
                                        <Text style={styles.savings}>
                                            Экономия: {(parseFloat(displayOffer.originalCost) - parseFloat(displayOffer.currentCost ?? '0')).toFixed(2)} ₽
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </>
                    )}

                    {/* Поля для стратегии */}
                    {isEditing && pricingMode === 'strategy' && (
                        <>
                            {/* Выбор стратегии */}
                            <View style={styles.fieldContainer}>
                                <Text style={styles.label}>Стратегия ценообразования *</Text>
                                {!showStrategyPicker ? (
                                    <TouchableOpacity
                                        style={styles.strategyInputContainer}
                                        onPress={() => setShowStrategyPicker(true)}
                                        activeOpacity={0.7}
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
                                                <Text style={styles.loadingText}>Загрузка стратегий...</Text>
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

                            {/* Информация о динамическом ценообразовании */}
                            {selectedStrategyId && (
                                <View style={styles.dynamicPricingInfo}>
                                    <IconSymbol name="info.circle" size={20} color="#007AFF" />
                                    <Text style={styles.dynamicPricingText}>
                                        Цена будет рассчитываться автоматически на основе выбранной стратегии и времени до истечения срока годности
                                    </Text>
                                </View>
                            )}
                        </>
                    )}

                    {/* Отображение текущей цены для динамического ценообразования (только для просмотра) */}
                    {!isEditing && offer.isDynamicPricing && offer.currentCost !== null && (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Текущая цена</Text>
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>
                                    {offer.currentCost} ₽
                                </Text>
                                <Text style={styles.dynamicPriceNote}>
                                    Рассчитана автоматически
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Количество */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Количество, шт *</Text>
                        {isEditing ? (
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
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>{offer.count} шт</Text>
                            </View>
                        )}
                    </View>

                    {/* Срок годности */}
                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Срок годности *</Text>
                        {isEditing ? (
                            <TextInput
                                style={styles.input}
                                value={displayOffer.expiresDate}
                                onChangeText={(text) => handleFieldChange('expiresDate', text)}
                                placeholder="ГГГГ-ММ-ДД"
                            />
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>
                                    {new Date(offer.expiresDate).toLocaleDateString('ru-RU', { 
                                        day: '2-digit', 
                                        month: '2-digit', 
                                        year: 'numeric' 
                                    })}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Описание */}
                    {displayOffer.description && (
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Примечание</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={displayOffer.description}
                                    onChangeText={(text) => handleFieldChange('description', text)}
                                    placeholder="Дополнительная информация"
                                    multiline
                                    numberOfLines={3}
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{offer.description}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Кнопки действий */}
                {isEditing && (
                    <View style={styles.actionsSection}>
                        <TouchableOpacity
                            style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={!hasChanges}
                        >
                            <Text style={styles.saveButtonText}>Сохранить изменения</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Кнопка удаления */}
                <View style={styles.dangerSection}>
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <IconSymbol name="trash" size={20} color="#fff" />
                        <Text style={styles.deleteButtonText}>Удалить предложение</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        flex: 1,
        marginLeft: 12,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E3F2FD',
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
    scrollContent: {
        padding: 16,
    },
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    productCard: {
        backgroundColor: '#F0F8FF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#B3D9FF',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    headerSpacer: {
        width: 100,
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
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 16,
    },
    shopCard: {
        backgroundColor: '#FFF9E6',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFE699',
    },
    shopName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    shopId: {
        fontSize: 13,
        color: '#666',
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    valueContainer: {
        paddingVertical: 4,
    },
    valueText: {
        fontSize: 16,
        color: '#333',
    },
    finalPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#4CAF50',
    },
    savings: {
        fontSize: 13,
        color: '#4CAF50',
        marginTop: 4,
    },
    actionsSection: {
        marginTop: 8,
        marginBottom: 24,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 16,
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
    dangerSection: {
        marginTop: 8,
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
    dynamicPricingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    dynamicPricingBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
        flex: 1,
    },
    dynamicPricingStrategyName: {
        fontSize: 12,
        color: '#007AFF',
        opacity: 0.8,
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
        gap: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
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
    strategySelector: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        backgroundColor: '#fff',
        maxHeight: 300,
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
        borderBottomColor: '#f0f0f0',
    },
    strategyItemSelected: {
        backgroundColor: '#F0F8FF',
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
    strategyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
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
    dynamicPricingInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#E3F2FD',
        padding: 12,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    dynamicPricingText: {
        flex: 1,
        fontSize: 13,
        color: '#007AFF',
        lineHeight: 18,
    },
    dynamicPriceNote: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
        fontStyle: 'italic',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
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
    selectorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    selectorTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    closeSelectorButton: {
        padding: 4,
    },
});


import { IconSymbol } from "@/components/ui/icon-symbol";
import { useOffers, Offer } from "@/hooks/useOffers";
import { useShops } from "@/hooks/useShops";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
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
    const { getOfferById, loading: offersLoading } = useOffers();
    
    const offer = getOfferById(offerId);
    const shop = offer ? shops.find(s => s.id === offer.shopId) : null;

    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    
    // Локальное состояние для редактирования
    const [editedOffer, setEditedOffer] = useState<{
        originalCost: number;
        currentCost: number;
        count: number;
        expiresDate: string;
        description?: string;
    } | null>(null);

    useEffect(() => {
        if (offer) {
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

        // Валидация
        if (editedOffer.originalCost <= 0) {
            Alert.alert("Ошибка", "Цена должна быть больше 0");
            return;
        }
        if (editedOffer.currentCost < 0) {
            Alert.alert("Ошибка", "Цена со скидкой не может быть отрицательной");
            return;
        }
        if (editedOffer.currentCost > editedOffer.originalCost) {
            Alert.alert("Ошибка", "Цена со скидкой не может быть больше оригинальной цены");
            return;
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
                        // TODO: Реализовать API запрос для сохранения
                        Alert.alert("Успех", "Изменения сохранены");
                        setIsEditing(false);
                        setHasChanges(false);
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
        return editedOffer?.currentCost || offer.currentCost;
    };

    const getDiscount = () => {
        const original = editedOffer?.originalCost || offer.originalCost;
        const current = editedOffer?.currentCost || offer.currentCost;
        if (original > 0) {
            return Math.round(((original - current) / original) * 100);
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
                                value={displayOffer.currentCost.toString()}
                                onChangeText={(text) => {
                                    const num = parseFloat(text) || 0;
                                    handleFieldChange('currentCost', num);
                                }}
                                keyboardType="decimal-pad"
                                placeholder="0.00"
                            />
                        ) : (
                            <View style={styles.valueContainer}>
                                <Text style={styles.valueText}>
                                    {offer.currentCost.toFixed(2)} ₽
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
                            {getDiscount() > 0 && (
                                <Text style={styles.savings}>
                                    Экономия: {(displayOffer.originalCost - displayOffer.currentCost).toFixed(2)} ₽
                                </Text>
                            )}
                        </View>
                    </View>

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
});


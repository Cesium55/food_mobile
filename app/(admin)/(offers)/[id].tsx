import { IconSymbol } from "@/components/ui/icon-symbol";
import { useShops } from "@/hooks/useShops";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Offer {
    id: number;
    productId: number;
    productName: string;
    shopId: number;
    shopName: string;
    price: number;
    discount: number;
    expiryDate: string;
    quantity: number;
}

export default function OfferDetailScreen() {
    const { id } = useLocalSearchParams();
    const offerId = typeof id === 'string' ? parseInt(id) : 0;
    const { shops } = useShops();

    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Демо-данные предложения
    const [offer, setOffer] = useState<Offer>({
        id: offerId,
        productId: 1,
        productName: 'Молоко пастеризованное 3.2%',
        shopId: 1,
        shopName: 'ТЦ "Мега" - Продукты',
        price: 89.90,
        discount: 10,
        expiryDate: '2025-10-25',
        quantity: 50,
    });

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
                            // Здесь можно сбросить изменения
                        }
                    }
                ]
            );
        } else {
            setIsEditing(false);
        }
    };

    const handleSave = () => {
        // Валидация
        if (offer.price <= 0) {
            Alert.alert("Ошибка", "Цена должна быть больше 0");
            return;
        }
        if (offer.quantity <= 0) {
            Alert.alert("Ошибка", "Количество должно быть больше 0");
            return;
        }
        if (offer.discount < 0 || offer.discount > 100) {
            Alert.alert("Ошибка", "Скидка должна быть от 0 до 100%");
            return;
        }

        Alert.alert(
            "Сохранить изменения?",
            "Изменения будут применены к предложению",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Сохранить",
                    onPress: () => {
                        // В реальном приложении - API запрос
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
                    onPress: () => {
                        setTimeout(() => {
                            Alert.alert("Успех", "Предложение удалено");
                            router.back();
                        }, 100);
                    }
                }
            ]
        );
    };

    const handleFieldChange = <K extends keyof Offer>(field: K, value: Offer[K]) => {
        setOffer({ ...offer, [field]: value });
        setHasChanges(true);
    };

    const getFinalPrice = () => {
        return offer.price - (offer.price * offer.discount / 100);
    };

    const getShopById = (shopId: number) => {
        return shops.find(s => s.id === shopId);
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
                        </View>
                    </View>

                    {/* Торговая точка */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Торговая точка</Text>
                        <View style={styles.shopCard}>
                            <Text style={styles.shopName}>{offer.shopName}</Text>
                            <Text style={styles.shopId}>ID точки: {offer.shopId}</Text>
                        </View>
                    </View>

                    {/* Основная информация */}
                    <View style={styles.infoSection}>
                        <Text style={styles.sectionTitle}>Основная информация</Text>

                        {/* Цена */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Цена, ₽ *</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={offer.price.toString()}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        handleFieldChange('price', num);
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{offer.price.toFixed(2)} ₽</Text>
                                </View>
                            )}
                        </View>

                        {/* Скидка */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Скидка, %</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={offer.discount.toString()}
                                    onChangeText={(text) => {
                                        const num = parseFloat(text) || 0;
                                        handleFieldChange('discount', num);
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>
                                        {offer.discount > 0 ? `${offer.discount}%` : 'Без скидки'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Итоговая цена */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Цена со скидкой</Text>
                            <View style={styles.valueContainer}>
                                <Text style={[styles.valueText, styles.finalPrice]}>
                                    {getFinalPrice().toFixed(2)} ₽
                                </Text>
                                {offer.discount > 0 && (
                                    <Text style={styles.savings}>
                                        Экономия: {(offer.price - getFinalPrice()).toFixed(2)} ₽
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
                                    value={offer.quantity.toString()}
                                    onChangeText={(text) => {
                                        const num = parseInt(text) || 0;
                                        handleFieldChange('quantity', num);
                                    }}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>{offer.quantity} шт</Text>
                                </View>
                            )}
                        </View>

                        {/* Срок годности */}
                        <View style={styles.fieldContainer}>
                            <Text style={styles.label}>Срок годности *</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={offer.expiryDate}
                                    onChangeText={(text) => handleFieldChange('expiryDate', text)}
                                    placeholder="ГГГГ-ММ-ДД"
                                />
                            ) : (
                                <View style={styles.valueContainer}>
                                    <Text style={styles.valueText}>
                                        {new Date(offer.expiryDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </Text>
                                </View>
                            )}
                        </View>
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
    productId: {
        fontSize: 13,
        color: '#666',
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


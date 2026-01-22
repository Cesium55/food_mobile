import { IconSymbol } from "@/components/ui/icon-symbol";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface OrderItem {
    id: number;
    productName: string;
    quantity: number;
    price: string; // decimal формат
}

interface Order {
    id: number;
    customerId: number;
    shopName: string;
    totalAmount: number;
    discount: number;
    items: OrderItem[];
}

interface ItemProcessingStatus {
    itemId: number;
    issued: boolean;
    reason?: string;
}

export default function ProcessOrderScreen() {
    const { id } = useLocalSearchParams();
    const orderId = typeof id === 'string' ? parseInt(id) : 0;

    // Демо-данные заказов
    const demoOrders: Order[] = [
        {
            id: 1,
            customerId: 1001,
            shopName: 'ТЦ "Мега" - Продукты',
            totalAmount: 235.80,
            discount: 10,
            items: [
                { id: 1, productName: 'Молоко пастеризованное 3.2%', quantity: 2, price: '89.90' },
                { id: 2, productName: 'Хлеб "Бородинский"', quantity: 1, price: '55.00' },
            ],
        },
        {
            id: 2,
            customerId: 1002,
            shopName: 'ул. Ленина, 15 - Продукты',
            totalAmount: 569.00,
            discount: 0,
            items: [
                { id: 3, productName: 'Яйца куриные С1', quantity: 1, price: '119.00' },
                { id: 4, productName: 'Сыр "Российский"', quantity: 1, price: '450.00' },
            ],
        },
        {
            id: 3,
            customerId: 1003,
            shopName: 'пр. Мира, 42 - Продукты',
            totalAmount: 890.50,
            discount: 15,
            items: [
                { id: 5, productName: 'Масло сливочное 82.5%', quantity: 1, price: '350.00' },
                { id: 6, productName: 'Творог 9%', quantity: 2, price: '180.00' },
                { id: 7, productName: 'Сметана 20%', quantity: 1, price: '95.50' },
            ],
        },
        {
            id: 4,
            customerId: 1004,
            shopName: 'ТЦ "Европа" - Продукты',
            totalAmount: 1250.00,
            discount: 50,
            items: [
                { id: 8, productName: 'Филе куриное', quantity: 1, price: '450.00' },
                { id: 9, productName: 'Говядина для жарки', quantity: 1, price: '650.00' },
                { id: 10, productName: 'Свинина ошеек', quantity: 1, price: '200.00' },
            ],
        },
        {
            id: 5,
            customerId: 1005,
            shopName: 'ул. Садовая, 8 - Продукты',
            totalAmount: 340.00,
            discount: 0,
            items: [
                { id: 11, productName: 'Кефир 2.5%', quantity: 2, price: '75.00' },
                { id: 12, productName: 'Йогурт натуральный', quantity: 3, price: '65.00' },
            ],
        },
    ];

    const order = demoOrders.find(o => o.id === orderId);

    // Состояние обработки каждого товара
    const [processingStatus, setProcessingStatus] = useState<ItemProcessingStatus[]>(
        order?.items.map(item => ({
            itemId: item.id,
            issued: true, // По умолчанию все товары выдаются
            reason: undefined,
        })) || []
    );

    // Модальное окно для выбора причины
    const [reasonModal, setReasonModal] = useState<{
        visible: boolean;
        itemId: number | null;
    }>({
        visible: false,
        itemId: null,
    });

    // Предустановленные причины
    const defaultReasons = [
        'Товар закончился',
        'Товар ненадлежащего качества',
    ];

    const [customReason, setCustomReason] = useState('');

    if (!order) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Заказ не найден</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Назад</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleBack = () => {
        router.back();
    };

    const handleToggleItem = (itemId: number) => {
        setProcessingStatus(prev =>
            prev.map(status =>
                status.itemId === itemId
                    ? { ...status, issued: !status.issued, reason: !status.issued ? undefined : status.reason }
                    : status
            )
        );
    };

    const handleOpenReasonModal = (itemId: number) => {
        setReasonModal({ visible: true, itemId });
        const currentStatus = processingStatus.find(s => s.itemId === itemId);
        setCustomReason(currentStatus?.reason || '');
    };

    const handleSelectReason = (reason: string) => {
        if (reasonModal.itemId !== null) {
            setProcessingStatus(prev =>
                prev.map(status =>
                    status.itemId === reasonModal.itemId
                        ? { ...status, reason }
                        : status
                )
            );
            setReasonModal({ visible: false, itemId: null });
            setCustomReason('');
        }
    };

    const handleConfirmOrder = () => {
        const notIssuedItems = processingStatus.filter(s => !s.issued);
        const notIssuedWithoutReason = notIssuedItems.filter(s => !s.reason);

        if (notIssuedWithoutReason.length > 0) {
            Alert.alert(
                'Укажите причину',
                'Для всех не выданных товаров необходимо указать причину.'
            );
            return;
        }

        const issuedCount = processingStatus.filter(s => s.issued).length;
        const totalCount = processingStatus.length;

        Alert.alert(
            'Подтверждение выдачи',
            `Выдано: ${issuedCount} из ${totalCount} товаров\n\nПодтвердить выдачу заказа?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Подтвердить',
                    onPress: () => {
                        // Здесь будет логика сохранения на сервер
                        Alert.alert(
                            'Успешно',
                            'Заказ обработан!',
                            [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        // Возвращаемся в профиль админа
                                        router.replace('/(admin)/(admin-profile)');
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const issuedCount = processingStatus.filter(s => s.issued).length;
    const canConfirm = processingStatus.filter(s => !s.issued).every(s => s.reason);

    return (
        <SafeAreaView style={styles.container}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.headerBackButton}>
                    <IconSymbol name="chevron.left" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Выдача заказа #{order.id}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Информация о заказе */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Информация о заказе</Text>
                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <IconSymbol name="person.fill" size={16} color="#666" />
                            <Text style={styles.infoText}>Клиент ID: {order.customerId}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <IconSymbol name="map.pin.fill" size={16} color="#666" />
                            <Text style={styles.infoText}>{order.shopName}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Сумма:</Text>
                            <Text style={styles.infoValue}>{order.totalAmount.toFixed(2)} ₽</Text>
                        </View>
                        {order.discount > 0 && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Скидка:</Text>
                                <Text style={styles.discountValue}>-{order.discount.toFixed(2)} ₽</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Список товаров */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Товары ({issuedCount}/{processingStatus.length} выдано)
                    </Text>
                    
                    {order.items.map(item => {
                        const status = processingStatus.find(s => s.itemId === item.id);
                        const isIssued = status?.issued ?? true;
                        const reason = status?.reason;

                        return (
                            <View key={item.id} style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <TouchableOpacity
                                        style={styles.checkbox}
                                        onPress={() => handleToggleItem(item.id)}
                                    >
                                        <View style={[styles.checkboxBox, isIssued && styles.checkboxBoxChecked]}>
                                            {isIssued && <IconSymbol name="checkmark" size={18} color="#fff" />}
                                        </View>
                                        <Text style={styles.checkboxLabel}>Выдан</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.productName}</Text>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemQuantity}>Количество: {item.quantity}</Text>
                                        <Text style={styles.itemPrice}>{item.price} ₽</Text>
                                    </View>
                                </View>

                                {!isIssued && (
                                    <View style={styles.reasonSection}>
                                        <Text style={styles.reasonLabel}>Причина:</Text>
                                        <TouchableOpacity
                                            style={[styles.reasonButton, reason && styles.reasonButtonFilled]}
                                            onPress={() => handleOpenReasonModal(item.id)}
                                        >
                                            <Text style={[styles.reasonButtonText, reason && styles.reasonButtonTextFilled]}>
                                                {reason || 'Выбрать причину'}
                                            </Text>
                                            <IconSymbol
                                                name="chevron.right"
                                                size={16}
                                                color={reason ? '#007AFF' : '#999'}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* Кнопка подтверждения */}
                <TouchableOpacity
                    style={[styles.confirmButton, !canConfirm && styles.confirmButtonDisabled]}
                    onPress={handleConfirmOrder}
                    disabled={!canConfirm}
                >
                    <IconSymbol name="checkmark" size={24} color="#fff" />
                    <Text style={styles.confirmButtonText}>Подтвердить выдачу</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Модальное окно выбора причины */}
            <Modal
                visible={reasonModal.visible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setReasonModal({ visible: false, itemId: null })}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Причина отказа</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setReasonModal({ visible: false, itemId: null });
                                    setCustomReason('');
                                }}
                            >
                                <IconSymbol name="xmark" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            {/* Предустановленные причины */}
                            {defaultReasons.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.reasonOption}
                                    onPress={() => handleSelectReason(reason)}
                                >
                                    <Text style={styles.reasonOptionText}>{reason}</Text>
                                </TouchableOpacity>
                            ))}

                            {/* Разделитель */}
                            <View style={styles.divider}>
                                <Text style={styles.dividerText}>или введите свою причину</Text>
                            </View>

                            {/* Кастомная причина */}
                            <TextInput
                                style={styles.customReasonInput}
                                placeholder="Введите причину..."
                                value={customReason}
                                onChangeText={setCustomReason}
                                multiline
                            />

                            <TouchableOpacity
                                style={[styles.saveReasonButton, !customReason.trim() && styles.saveReasonButtonDisabled]}
                                onPress={() => customReason.trim() && handleSelectReason(customReason.trim())}
                                disabled={!customReason.trim()}
                            >
                                <Text style={styles.saveReasonButtonText}>Сохранить</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
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
    headerBackButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    placeholder: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
        paddingBottom: 40,
        paddingHorizontal: 0,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        flex: 1,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    discountValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    itemHeader: {
        marginBottom: 12,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkboxBox: {
        width: 28,
        height: 28,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    checkboxBoxChecked: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    checkboxLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    itemInfo: {
        gap: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000',
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
    },
    reasonSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    reasonLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    reasonButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    reasonButtonFilled: {
        backgroundColor: '#fff',
        borderColor: '#007AFF',
    },
    reasonButtonText: {
        fontSize: 14,
        color: '#999',
        flex: 1,
    },
    reasonButtonTextFilled: {
        color: '#007AFF',
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 8,
    },
    confirmButtonDisabled: {
        backgroundColor: '#ccc',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    modalScroll: {
        padding: 20,
    },
    reasonOption: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    reasonOptionText: {
        fontSize: 16,
        color: '#000',
    },
    divider: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    },
    customReasonInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    saveReasonButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    saveReasonButtonDisabled: {
        backgroundColor: '#ccc',
    },
    saveReasonButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#666',
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        paddingHorizontal: 32,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});


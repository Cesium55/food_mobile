import { TabScreen } from "@/components/TabScreen";
import { StandardModal } from "@/components/ui";
import { UserCard } from "@/components/UserCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getSellerSystemBalance, SellerSystemBalance } from "@/services/paymentService";
import { useUser } from "@/hooks/useUser";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminProfile() {
    const user = useUser();
    const [balanceModalVisible, setBalanceModalVisible] = useState(false);
    const [balance, setBalance] = useState<SellerSystemBalance | null>(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [balanceError, setBalanceError] = useState<string | null>(null);

    const handleSwitchToCustomer = () => {
        router.replace('/(tabs)/(home)');
    };

    const openBalanceModal = async () => {
        try {
            setBalanceModalVisible(true);
            setLoadingBalance(true);
            setBalanceError(null);
            const data = await getSellerSystemBalance();
            setBalance(data);
        } catch (error: any) {
            setBalanceError(error?.message || 'Не удалось загрузить баланс');
            setBalance(null);
        } finally {
            setLoadingBalance(false);
        }
    };

    return (
        <TabScreen title="Профиль администратора">
            <View style={styles.container}>
                <UserCard user={user} />
                
                <Text style={styles.modeLabel}>Режим: Администратор</Text>
                
                {/* Кнопка сканирования QR заказа */}
                <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(admin)/(admin-profile)/scan-order')}>
                    <IconSymbol name="qrcode" size={24} color="#fff" />
                    <Text style={styles.scanButtonText}>Сканировать QR заказа</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.balanceButton} onPress={openBalanceModal}>
                    <IconSymbol name="creditcard.fill" size={22} color="#fff" />
                    <Text style={styles.balanceButtonText}>Посмотреть баланс</Text>
                </TouchableOpacity>

                {/* Кнопка перехода в режим покупателя */}
                <TouchableOpacity style={styles.switchButton} onPress={handleSwitchToCustomer}>
                    <Text style={styles.switchButtonText}>Перейти в режим покупателя</Text>
                </TouchableOpacity>
            </View>

            <StandardModal
                visible={balanceModalVisible}
                onClose={() => setBalanceModalVisible(false)}
                heightPercent={0.5}
            >
                <View style={styles.balanceModalContent}>
                    <Text style={styles.balanceModalTitle}>Баланс продавца</Text>

                    {loadingBalance ? (
                        <View style={styles.balanceStateBlock}>
                            <ActivityIndicator size="small" color="#007AFF" />
                            <Text style={styles.balanceStateText}>Загрузка...</Text>
                        </View>
                    ) : balanceError ? (
                        <View style={styles.balanceStateBlock}>
                            <Text style={styles.balanceErrorText}>{balanceError}</Text>
                        </View>
                    ) : balance ? (
                        <View style={styles.balanceRows}>
                            <View style={styles.balanceRow}>
                                <Text style={styles.balanceLabel}>Системный баланс</Text>
                                <Text style={styles.balanceValue}>{balance.system_balance} {balance.currency}</Text>
                            </View>
                            <View style={styles.balanceRow}>
                                <Text style={styles.balanceLabel}>Выданные товары</Text>
                                <Text style={styles.balanceValue}>{balance.issued_goods_balance} {balance.currency}</Text>
                            </View>
                            <View style={styles.balanceRow}>
                                <Text style={styles.balanceLabel}>Выдано более недели</Text>
                                <Text style={styles.balanceValue}>
                                    {balance.issued_goods_older_than_week_balance} {balance.currency}
                                </Text>
                            </View>
                        </View>
                    ) : null}
                </View>
            </StandardModal>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
        backgroundColor: '#f5f5f5',
    },
    modeLabel: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginVertical: 20,
        color: '#007AFF',
    },
    scanButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 16,
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    balanceButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    balanceButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchButton: {
        backgroundColor: '#34C759',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    balanceModalContent: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    balanceModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    balanceStateBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 10,
    },
    balanceStateText: {
        fontSize: 14,
        color: '#666',
    },
    balanceErrorText: {
        fontSize: 14,
        color: '#F44336',
        textAlign: 'center',
    },
    balanceRows: {
        gap: 12,
    },
    balanceRow: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e8e8e8',
        borderRadius: 12,
        padding: 12,
    },
    balanceLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 6,
    },
    balanceValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
});


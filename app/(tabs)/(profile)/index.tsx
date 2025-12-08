import { FullWidthLink } from "@/components/FullWidthLink";
import { TabScreen } from "@/components/TabScreen";
import { UserCard } from "@/components/UserCard";
import { CurrentOrders } from "@/components/profile/CurrentOrders";
import { log } from "@/constants/config";
import { useOrders } from "@/hooks/useOrders";
import { useUser } from "@/hooks/useUser";
import { authService } from "@/services/autoAuthService";
import { clearTokens } from "@/utils/storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
    const user = useUser();
    const { getCurrentOrders, loading, refetchCurrentPending, refetchPaidOrders } = useOrders();
    const currentOrders = getCurrentOrders();

    // Обновляем текущий заказ и оплаченные заказы при фокусе на экране
    useFocusEffect(
        useCallback(() => {
            refetchCurrentPending();
            refetchPaidOrders();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [])
    );

    const handleSwitchToAdmin = () => {
        router.replace('/(admin)/(admin-profile)');
    };

    const handleLogout = async () => {
        Alert.alert(
            'Выход',
            'Вы уверены, что хотите выйти из аккаунта?',
            [
                {
                    text: 'Отмена',
                    style: 'cancel',
                },
                {
                    text: 'Выйти',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Очищаем токены
                            await clearTokens();
                            // Очищаем кеш пользователя
                            authService.clearCache();
                            log('info', 'Пользователь вышел из системы');
                            // Переходим на страницу регистрации
                            router.replace('/register');
                        } catch (error) {
                            log('error', 'Ошибка при выходе', { error });
                            Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
                        }
                    },
                },
            ]
        );
    };

    return (
        <TabScreen title="Profile">
            <View style={styles.container}>
                <UserCard user={user} />
                
                {/* Текущие заказы */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.loadingText}>Загрузка заказов...</Text>
                    </View>
                ) : (
                    <CurrentOrders orders={currentOrders} />
                )}
                
                <FullWidthLink 
                    href="/(tabs)/(profile)/settings"
                    iconName="gear"
                    text="Settings"
                />
                <FullWidthLink 
                    href="/(tabs)/(profile)/history"
                    iconName="history"
                    text="History"
                />
                
                {/* Кнопка перехода в режим администратора - только для продавцов */}
                {user.is_seller && (
                    <TouchableOpacity style={styles.adminButton} onPress={handleSwitchToAdmin}>
                        <Text style={styles.adminButtonText}>Перейти в режим администратора</Text>
                    </TouchableOpacity>
                )}
                
                {/* Кнопка выхода */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
                </TouchableOpacity>
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    adminButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 10,
        alignItems: 'center',
    },
    adminButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ff3b30',
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 10,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
});
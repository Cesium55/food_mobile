import { FullWidthLink } from "@/components/FullWidthLink";
import { UserCard } from "@/components/UserCard";
import { CurrentOrders } from "@/components/profile/CurrentOrders";
import { ScreenWrapper } from "@/components/screen/ScreenWrapper";
import { log } from "@/constants/config";
import { useOrders } from "@/hooks/useOrders";
import { useUser } from "@/hooks/useUser";
import { authService } from "@/services/autoAuthService";
import { clearTokens } from "@/utils/storage";
import { useNavigation } from "@react-navigation/native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
    const user = useUser();
    const navigation = useNavigation();
    const { getCurrentOrders, loading, refetchCurrentPending, refetchPaidOrders } = useOrders();
    const currentOrders = getCurrentOrders();
    const isInitialMount = useRef(true);

    // Скрываем таббар при фокусе на профиле
    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            if (parent) {
                parent.setOptions({
                    tabBarStyle: { display: 'none' },
                });
            }
            // Не восстанавливаем таббар в cleanup - он останется скрытым для всех экранов профиля
        }, [navigation])
    );

    // Обновляем данные только при первом монтировании или при явном обновлении
    useFocusEffect(
        useCallback(() => {
            // Обновляем только при первом входе в профиль, не при возврате из дочерних страниц
            if (isInitialMount.current) {
                isInitialMount.current = false;
                refetchCurrentPending();
                refetchPaidOrders();
            }
        }, [refetchCurrentPending, refetchPaidOrders])
    );

    // Обработчик обновления через pull-to-refresh
    const handleRefresh = useCallback(async () => {
        await Promise.all([
            refetchCurrentPending(),
            refetchPaidOrders(),
        ]);
    }, [refetchCurrentPending, refetchPaidOrders]);

    const handleSwitchToAdmin = () => {
        router.replace('/(admin)/(admin-profile)');
    };

    const handleStartSellerOnboarding = () => {
        router.push({
            pathname: '/workflow/[workflowId]',
            params: {
                workflowId: 'seller-onboarding',
                persist: '0',
                exitTo: '/(tabs)/(profile)/support',
                firstBackTo: '/(tabs)/(profile)',
            },
        });
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
        <ScreenWrapper 
            title="Профиль" 
            showBackButton={true}
            onBackPress={() => {
                // Восстанавливаем таббар перед переходом
                const parent = navigation.getParent();
                if (parent) {
                    parent.setOptions({
                        tabBarStyle: { display: 'flex' },
                    });
                }
                router.replace('/(tabs)/(home)');
            }}
            onRefresh={handleRefresh}
            refreshing={loading}
        >
            <View style={styles.container}>
                <UserCard user={user} />
                
                {/* Текущие заказы */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={styles.loadingText}>Загрузка заказов...</Text>
                    </View>
                ) : currentOrders.length > 0 ? (
                    <View style={styles.ordersSection}>
                        <CurrentOrders orders={currentOrders} />
                    </View>
                ) : null}
                
                <View style={styles.menuSection}>
                    <FullWidthLink 
                        href="/(tabs)/(profile)/settings"
                        iconName="gear"
                        text="Settings"
                        isFirst={true}
                    />
                    <View style={styles.divider} />
                    <FullWidthLink 
                        href="/(tabs)/(profile)/history"
                        iconName="history"
                        text="History"
                    />
                    <View style={styles.divider} />
                    <FullWidthLink
                        href="/(tabs)/(profile)/support"
                        iconName="paperplane.fill"
                        text="Поддержка"
                        isLast={true}
                    />
                </View>
                
                {/* Кнопка перехода в режим администратора - только для продавцов */}
                {user.is_seller && (
                    <TouchableOpacity style={styles.adminButton} onPress={handleSwitchToAdmin}>
                        <Text style={styles.adminButtonText}>Перейти в режим администратора</Text>
                    </TouchableOpacity>
                )}

                {/* Кнопка старта процесса регистрации продавца - только для обычных пользователей */}
                {!user.is_seller && (
                    <TouchableOpacity style={styles.sellerOnboardingButton} onPress={handleStartSellerOnboarding}>
                        <Text style={styles.sellerOnboardingButtonText}>Хочу стать продавцом</Text>
                    </TouchableOpacity>
                )}
                
                {/* Кнопка выхода */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Выйти из аккаунта</Text>
                </TouchableOpacity>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    adminButton: {
        backgroundColor: '#007AFF',
        borderRadius: 28,
        padding: 16,
        marginTop: 10,
        alignItems: 'center',
    },
    adminButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    sellerOnboardingButton: {
        backgroundColor: '#34C759',
        borderRadius: 28,
        padding: 16,
        marginTop: 10,
        alignItems: 'center',
    },
    sellerOnboardingButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#ff3b30',
        borderRadius: 28,
        padding: 16,
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
    ordersSection: {
        backgroundColor: '#fff',
        borderRadius: 28,
        marginBottom: 12,
        overflow: 'hidden',
    },
    menuSection: {
        backgroundColor: '#fff',
        borderRadius: 28,
        marginBottom: 12,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 16,
    },
});


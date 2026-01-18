import { FullWidthLink } from "@/components/FullWidthLink";
import { UserCard } from "@/components/UserCard";
import { CurrentOrders } from "@/components/profile/CurrentOrders";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { log } from "@/constants/config";
import { spacing, typography } from "@/constants/tokens";
import { useColors } from "@/contexts/ThemeContext";
import { useOrders } from "@/hooks/useOrders";
import { useUser } from "@/hooks/useUser";
import { authService } from "@/services/autoAuthService";
import { clearTokens } from "@/utils/storage";
import { useNavigation } from "@react-navigation/native";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
    const user = useUser();
    const navigation = useNavigation();
    const { getCurrentOrders, loading, refetchCurrentPending, refetchPaidOrders } = useOrders();
    const currentOrders = getCurrentOrders();

    // Скрываем таббар при фокусе на профиле
    useFocusEffect(
        useCallback(() => {
            const parent = navigation.getParent();
            if (parent) {
                parent.setOptions({
                    tabBarStyle: { display: 'none' },
                });
            }
            
            return () => {
                // Восстанавливаем таббар при уходе
                if (parent) {
                    parent.setOptions({
                        tabBarStyle: { display: 'flex' },
                    });
                }
            };
        }, [navigation])
    );

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

    const colors = useColors();
    const stylesWithColors = createStyles(colors);

    return (
        <SafeAreaView style={[stylesWithColors.container, { backgroundColor: '#ffffff' }]} edges={[]}>
            {/* Верхняя панель с заголовком и кнопкой назад */}
            <View style={stylesWithColors.topBarWrapper}>
                <View style={stylesWithColors.topBar}>
                    <TouchableOpacity 
                        style={stylesWithColors.backButton}
                        onPress={() => router.replace('/(tabs)/(home)')}
                    >
                        <IconSymbol 
                            name="arrow.left" 
                            color={colors.text.primary}
                            size={24}
                        />
                    </TouchableOpacity>
                    <Text style={[stylesWithColors.title, { color: colors.text.primary }]}>Профиль</Text>
                    <View style={stylesWithColors.spacer} />
                </View>
            </View>

            <View style={stylesWithColors.contentWrapper}>
                <ScrollView 
                    style={stylesWithColors.content} 
                    contentContainerStyle={stylesWithColors.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
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
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
    topBarWrapper: {
        overflow: 'hidden',
        zIndex: 10,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        paddingTop: spacing.sm,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        backgroundColor: colors.background.default,
    },
    contentWrapper: {
        flex: 1,
        backgroundColor: '#eeeeee',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        marginTop: -28,
        paddingTop: 28,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: typography.fontSize.xxl,
        fontFamily: typography.fontFamily.bold,
        flex: 1,
        textAlign: 'center',
    },
    spacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});

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
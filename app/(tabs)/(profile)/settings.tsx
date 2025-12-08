import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { configureNotifications, getFCMToken, initializeFirebase, sendFCMTokenToServer } from "@/services/firebaseService";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Settings() {
    const [loading, setLoading] = useState(false);

    const handleGetToken = async () => {
        setLoading(true);
        try {
            initializeFirebase();
            await configureNotifications();
            const token = await getFCMToken();
            
            if (token) {
                Alert.alert(
                    'FCM Token',
                    `Токен получен:\n\n${token}`,
                    [
                        {
                            text: 'Скопировать',
                            onPress: () => {
                                // В React Native нет прямого доступа к clipboard, но можно показать токен
                                Alert.alert('Токен скопирован в сообщение', token);
                            },
                        },
                        { text: 'OK' },
                    ]
                );
            } else {
                Alert.alert('Ошибка', 'Не удалось получить FCM токен');
            }
        } catch (error) {
            Alert.alert('Ошибка', `Ошибка получения токена: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendToken = async () => {
        setLoading(true);
        try {
            initializeFirebase();
            await configureNotifications();
            const token = await getFCMToken();
            
            if (!token) {
                Alert.alert('Ошибка', 'Не удалось получить FCM токен для отправки');
                setLoading(false);
                return;
            }

            const success = await sendFCMTokenToServer(token);
            
            if (success) {
                Alert.alert('Успех', `FCM токен успешно отправлен на сервер:\n\n${token}`);
            } else {
                Alert.alert('Ошибка', 'Не удалось отправить FCM токен на сервер. Проверьте авторизацию.');
            }
        } catch (error) {
            Alert.alert('Ошибка', `Ошибка отправки токена: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TabScreen title="Settings" showBackButton={true}>
            <View style={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Debug</Text>
                    
                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleGetToken}
                        disabled={loading}
                    >
                        <IconSymbol name="key.fill" color="#fff" size={20} />
                        <Text style={styles.buttonText}>Получить FCM токен</Text>
                        {loading && <ActivityIndicator size="small" color="#fff" style={styles.loader} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.buttonSecondary, loading && styles.buttonDisabled]} 
                        onPress={handleSendToken}
                        disabled={loading}
                    >
                        <IconSymbol name="paperplane.fill" color="#007AFF" size={20} />
                        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Отправить FCM токен</Text>
                        {loading && <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />}
                    </TouchableOpacity>
                </View>
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
    },
    buttonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    buttonTextSecondary: {
        color: '#007AFF',
    },
    loader: {
        marginLeft: 8,
    },
});

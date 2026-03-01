import { ScreenWrapper } from "@/components/screen/ScreenWrapper";
import { SettingsInputsModalContent } from "@/components/profile/SettingsInputsModalContent";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useModal } from "@/contexts/ModalContext";
import { configureNotifications, getFCMToken, initializeFirebase, sendFCMTokenToServer } from "@/services/firebaseService";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Тестовый компонент модалки
function TestModal({ level }: { level: number }) {
    const { openModal, closeModal } = useModal();

    const handleOpenAnother = () => {
        console.log(`Opening modal level ${level + 1} from level ${level}`);
        openModal(<TestModal level={level + 1} />);
    };

    return (
        <View style={styles.testModalContainer}>
            <Text style={styles.testModalTitle}>Тестовая модалка #{level}</Text>
            <Text style={styles.testModalText}>
                Это тестовая модалка уровня {level}
            </Text>
            <Text style={styles.testModalText}>
                Нажмите кнопку ниже, чтобы открыть еще одну такую же модалку поверх этой.
            </Text>
            
            <TouchableOpacity 
                style={styles.testModalButton}
                onPress={handleOpenAnother}
            >
                <IconSymbol name="plus" color="#fff" size={20} />
                <Text style={styles.testModalButtonText}>Открыть модалку #{level + 1}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.testModalButton, styles.testModalButtonClose]}
                onPress={closeModal}
            >
                <IconSymbol name="xmark" color="#333" size={20} />
                <Text style={[styles.testModalButtonText, styles.testModalButtonTextClose]}>Закрыть эту модалку</Text>
            </TouchableOpacity>

            <View style={styles.testModalSpacer} />
        </View>
    );
}

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const { openModal } = useModal();

    const handleOpenModal = () => {
        openModal(<TestModal level={1} />);
    };

    const handleOpenInputsModal = () => {
        openModal(<SettingsInputsModalContent />);
    };

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

    const handleOpenTestWorkflow = () => {
        router.push({
            pathname: "/workflow/[workflowId]",
            params: {
                workflowId: "settings-test-workflow",
                exitTo: "/(tabs)/(home)",
            },
        });
    };

    const handleOpenTestWorkflowWithoutState = () => {
        router.push({
            pathname: "/workflow/[workflowId]",
            params: {
                workflowId: "settings-test-workflow-no-state",
                exitTo: "/(tabs)/(home)",
                persist: "0",
            },
        });
    };

    return (
        <ScreenWrapper title="Settings">
            <View style={styles.container}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Формы</Text>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonOutline]}
                        onPress={handleOpenInputsModal}
                    >
                        <IconSymbol name="list.bullet" color="#333" size={20} />
                        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Открыть модалку с 10 инпутами</Text>
                    </TouchableOpacity>
                </View>

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

                    <TouchableOpacity 
                        style={[styles.button, styles.buttonOutline]} 
                        onPress={handleOpenModal}
                    >
                        <IconSymbol name="plus" color="#333" size={20} />
                        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Открыть тестовую модалку</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.buttonOutline]} 
                        onPress={handleOpenTestWorkflow}
                    >
                        <IconSymbol name="list.bullet.rectangle" color="#333" size={20} />
                        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Запустить тестовый workflow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.buttonOutline]} 
                        onPress={handleOpenTestWorkflowWithoutState}
                    >
                        <IconSymbol name="rectangle.stack.badge.minus" color="#333" size={20} />
                        <Text style={[styles.buttonText, styles.buttonTextOutline]}>Workflow без сохранения</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingTop: 20,
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
    buttonOutline: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
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
    buttonTextOutline: {
        color: '#333',
    },
    loader: {
        marginLeft: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    modalItem: {
        fontSize: 16,
        color: '#666',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    testModalContainer: {
        padding: 20,
    },
    testModalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center',
    },
    testModalText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
        lineHeight: 24,
    },
    testModalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        marginTop: 20,
        marginBottom: 12,
    },
    testModalButtonClose: {
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    testModalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    testModalButtonTextClose: {
        color: '#333',
    },
    testModalSpacer: {
        height: 100,
    },
});


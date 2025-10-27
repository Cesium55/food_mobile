import { IconSymbol } from "@/components/ui/icon-symbol";
import { API_ENDPOINTS } from "@/constants/api";
import { getApiUrl } from "@/constants/env";
import { authFetch } from "@/utils/authFetch";
import { router } from "expo-router";
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

export default function NewPointScreen() {
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!address.trim()) {
            Alert.alert("Ошибка", "Введите адрес");
            return;
        }

        setIsLoading(true);

        try {
            const response = await authFetch(getApiUrl(API_ENDPOINTS.SHOP_POINTS.CREATE_BY_ADDRESS), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    raw_address: address.trim()
                })
            });

            if (response.ok) {
                Alert.alert(
                    "Успех",
                    "Торговая точка успешно создана!",
                    [{ 
                        text: "OK",
                        onPress: () => router.back()
                    }]
                );
            } else {
                const errorData = await response.json();
                Alert.alert("Ошибка", errorData.message || "Не удалось создать торговую точку");
            }
        } catch (error) {
            Alert.alert("Ошибка", "Ошибка подключения к серверу");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            "Отмена",
            "Вы уверены, что хотите отменить создание точки?",
            [
                { text: "Нет", style: "cancel" },
                {
                    text: "Да",
                    style: "destructive",
                    onPress: () => router.back()
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Заголовок */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.headerBackButton}
                    onPress={handleCancel}
                >
                    <IconSymbol name="arrow.left" color="#333" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    Новая торговая точка
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Информация о точке */}
                <View style={styles.infoSection}>
                    <Text style={styles.infoText}>
                        Введите адрес торговой точки. Координаты будут определены автоматически.
                    </Text>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Адрес *</Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Москва, Большая Садовая, 21А"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Кнопки действий */}
                <View style={styles.actionsSection}>
                    <TouchableOpacity 
                        style={[styles.createButton, isLoading && styles.createButtonDisabled]}
                        onPress={handleCreate}
                        disabled={isLoading || !address.trim()}
                    >
                        <Text style={styles.createButtonText}>
                            {isLoading ? "Создание..." : "Создать торговую точку"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>Отмена</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerBackButton: {
        marginRight: 12,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    infoSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 8,
        marginTop: 16,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        lineHeight: 20,
    },
    fieldContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        minHeight: 80,
    },
    actionsSection: {
        backgroundColor: '#fff',
        padding: 16,
    },
    createButton: {
        backgroundColor: '#34C759',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});


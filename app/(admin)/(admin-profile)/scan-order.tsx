import { TabScreen } from "@/components/TabScreen";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { router } from "expo-router";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ScanOrder() {
    const [isScanning, setIsScanning] = useState(false);

    const handleBack = () => {
        router.back();
    };

    // Симуляция сканирования QR кода
    const handleScan = () => {
        setIsScanning(true);
        
        // Имитируем процесс сканирования
        setTimeout(() => {
            setIsScanning(false);
            // Генерируем случайный ID заказа для демонстрации
            const demoOrderIds = [1, 2, 3, 4, 5];
            const randomOrderId = demoOrderIds[Math.floor(Math.random() * demoOrderIds.length)];
            
            // Переходим на страницу обработки заказа
            router.push(`/(admin)/(admin-profile)/process-order/${randomOrderId}`);
        }, 1500);
    };

    return (
        <SafeAreaView style={styles.container}>
            <TabScreen title="Сканирование QR заказа">
                {/* Заголовок */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                        <IconSymbol name="chevron.left" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Сканировать QR</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.content}>
                    {/* Область сканирования */}
                    <View style={styles.scanArea}>
                        <View style={styles.qrFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                            
                            <IconSymbol name="qrcode" size={120} color="#007AFF" />
                        </View>
                    </View>

                    {/* Инструкция */}
                    <Text style={styles.instruction}>
                        Наведите камеру на QR-код заказа
                    </Text>

                    {/* Кнопка для демонстрации */}
                    <TouchableOpacity 
                        style={[styles.scanButton, isScanning && styles.scanButtonDisabled]} 
                        onPress={handleScan}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <Text style={styles.scanButtonText}>Сканирование...</Text>
                        ) : (
                            <>
                                <IconSymbol name="qrcode" size={24} color="#fff" />
                                <Text style={styles.scanButtonText}>Симулировать сканирование</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </TabScreen>
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
    backButton: {
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
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    scanArea: {
        width: '100%',
        aspectRatio: 1,
        maxWidth: 300,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    qrFrame: {
        width: '80%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#007AFF',
        borderWidth: 4,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    instruction: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    scanButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        minWidth: 280,
    },
    scanButtonDisabled: {
        backgroundColor: '#999',
    },
    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    hint: {
        marginTop: 20,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});


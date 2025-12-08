import { IconSymbol } from "@/components/ui/icon-symbol";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ScanOrder() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (permission === null) {
            requestPermission().catch((error) => {
                console.error('Ошибка при запросе разрешения на камеру:', error);
            });
        }
    }, [permission, requestPermission]);

    // Сбрасываем состояние сканирования при возврате на экран
    useFocusEffect(
        useCallback(() => {
            setScanned(false);
        }, [])
    );

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (!scanned) {
            setScanned(true);
            // Сразу переходим к обработке заказа без показа токена
            router.push({
                pathname: '/(admin)/(admin-profile)/fulfill-order',
                params: {
                    token: data,
                },
            });
        }
    };

    const handleReset = () => {
        setScanned(false);
    };

    const handleClose = () => {
        router.back();
    };

    if (permission === null) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                        <IconSymbol name="arrow.left" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <View style={styles.permissionContainer}>
                    <Text style={styles.message}>Запрос разрешения на камеру...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.backButton}>
                        <IconSymbol name="arrow.left" size={24} color="#333" />
                    </TouchableOpacity>
                </View>
                <View style={styles.permissionContainer}>
                    <IconSymbol name="camera" size={64} color="#666" />
                    <Text style={styles.message}>
                        Нужен доступ к камере для сканирования QR кодов
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={requestPermission}
                    >
                        <Text style={styles.buttonText}>Предоставить доступ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={handleClose}
                    >
                        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                            Назад
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Убеждаемся, что разрешение точно получено перед рендерингом камеры
    if (!permission || !permission.granted) {
        return null;
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.scanArea}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <Text style={styles.instruction}>
                        Наведите камеру на QR код
                    </Text>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    backButton: {
        padding: 8,
    },
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#fff",
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
    },
    scanArea: {
        width: 250,
        height: 250,
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 30,
        height: 30,
        borderColor: "#4CAF50",
        borderWidth: 3,
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
        marginTop: 30,
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 12,
        borderRadius: 8,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonPrimary: {
        backgroundColor: "#4CAF50",
    },
    buttonSecondary: {
        backgroundColor: "#f0f0f0",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    buttonTextSecondary: {
        color: "#333",
    },
    message: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginTop: 20,
        marginBottom: 20,
    },
});

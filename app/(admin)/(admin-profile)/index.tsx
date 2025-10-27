import { TabScreen } from "@/components/TabScreen";
import { UserCard } from "@/components/UserCard";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useUser } from "@/hooks/useUser";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AdminProfile() {
    const user = useUser();

    const handleSwitchToCustomer = () => {
        router.replace('/(tabs)/(home)');
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

                {/* Кнопка перехода в режим покупателя */}
                <TouchableOpacity style={styles.switchButton} onPress={handleSwitchToCustomer}>
                    <Text style={styles.switchButtonText}>Перейти в режим покупателя</Text>
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
        marginHorizontal: 16,
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
    switchButton: {
        backgroundColor: '#34C759',
        borderRadius: 8,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 12,
        alignItems: 'center',
    },
    switchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});


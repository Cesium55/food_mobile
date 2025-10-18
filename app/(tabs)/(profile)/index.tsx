import { FullWidthLink } from "@/components/FullWidthLink";
import { TabScreen } from "@/components/TabScreen";
import { UserCard } from "@/components/UserCard";
import { CurrentOrders } from "@/components/profile/CurrentOrders";
import { useOrders } from "@/hooks/useOrders";
import { useUser } from "@/hooks/useUser";
import { StyleSheet, View } from "react-native";

export default function Profile() {
    const user = useUser();
    const { getCurrentOrders } = useOrders();
    const currentOrders = getCurrentOrders();

    return (
        <TabScreen title="Profile">
            <View style={styles.container}>
                <UserCard user={user} />
                
                {/* Текущие заказы */}
                <CurrentOrders orders={currentOrders} />
                
                <FullWidthLink 
                    href="/(tabs)/(profile)/settings"
                    iconName="gear"
                    text="Settings"
                />
                <FullWidthLink 
                    href="/(tabs)/(profile)/history"
                    iconName="gear"
                    text="History"
                />
            </View>
        </TabScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 20,
    },
});
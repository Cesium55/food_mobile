import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TextInput, View } from "react-native";

interface SearchProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
}

export default function Search({ 
    placeholder = "Поиск...", 
    value,
    onChangeText 
}: SearchProps) {
    return (
        <View style={styles.container}>
            <Ionicons 
                name="search" 
                size={20} 
                color="#666" 
                style={styles.icon} 
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChangeText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        borderRadius: 30,
        paddingHorizontal: 12,
        // paddingVertical: 10,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
    },
});
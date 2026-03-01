import { SettingsInputsList } from "@/components/profile/SettingsInputsList";
import { StyleSheet, Text, View } from "react-native";

export function SettingsInputsModalContent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>10 инпутов</Text>
      <SettingsInputsList />
      <View style={styles.keyboardSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  keyboardSpacer: {
    height: 160,
  },
});

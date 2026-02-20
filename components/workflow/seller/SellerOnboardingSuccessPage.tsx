import { Button } from "@/components/ui/Button";
import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import type { WorkflowPageProps } from "@/components/workflow/types";
import { StyleSheet, Text, View } from "react-native";

export function SellerOnboardingSuccessPage(props: WorkflowPageProps) {
  return (
    <ProfileScreenWrapper
      title="Заявка отправлена"
      showBackButton
      onBackPress={() => props.emit("back")}
      useScrollView={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Заявка на регистрацию продавца успешно принята</Text>
        <Text style={styles.text}>Ожидайте подтверждения от нашей команды.</Text>

        <Button onPress={() => props.emit("next")} loading={props.isInitializing} fullWidth>
          Перейти в поддержку
        </Button>
      </View>
    </ProfileScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 10,
    textAlign: "center",
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    textAlign: "center",
    marginBottom: 24,
  },
});

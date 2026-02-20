import { Button } from "@/components/ui/Button";
import type { WorkflowPageProps } from "@/components/workflow/types";
import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import { StyleSheet, Text, View } from "react-native";

export function SellerOnboardingIntroPage(props: WorkflowPageProps) {
  return (
    <ProfileScreenWrapper
      title="Стать продавцом"
      showBackButton
      onBackPress={() => props.emit("back")}
      useScrollView={false}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Добро пожаловать в программу продавцов</Text>
        <Text style={styles.text}>
          Мы рады сотрудничеству. В этом коротком процессе вы подтвердите согласия
          и заполните данные магазина для старта.
        </Text>

        <Button onPress={() => props.emit("next")} loading={props.isInitializing} fullWidth>
          Далее
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
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
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

import { Button } from "@/components/ui/Button";
import { ProfileScreenWrapper } from "@/components/profile/ProfileScreenWrapper";
import { StyleSheet, Text, View } from "react-native";

interface DemoWorkflowPageProps {
  title: string;
  description: string;
  stepLabel: string;
  canGoBack: boolean;
  isInitializing: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function DemoWorkflowPage({
  title,
  description,
  stepLabel,
  canGoBack,
  isInitializing,
  onBack,
  onNext,
}: DemoWorkflowPageProps) {
  return (
    <ProfileScreenWrapper
      title={title}
      showBackButton={canGoBack}
      onBackPress={onBack}
      useScrollView={false}
    >
      <View style={styles.container}>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.actions}>
          <Button loading={isInitializing} onPress={onNext} fullWidth>
            Далее
          </Button>
        </View>
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
  stepLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#222",
    textAlign: "center",
    lineHeight: 24,
  },
  actions: {
    marginTop: 24,
  },
});

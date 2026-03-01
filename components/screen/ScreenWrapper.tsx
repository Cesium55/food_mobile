import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenContent } from "./ScreenContent";
import { ScreenTopBar } from "./ScreenTopBar";

interface ScreenWrapperProps {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  showTopBar?: boolean;
  onBackPress?: () => void;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
  useScrollView?: boolean;
  avoidKeyboard?: boolean;
  keyboardVerticalOffset?: number;
}

export function ScreenWrapper({
  title,
  children,
  showBackButton = true,
  showTopBar = true,
  onBackPress,
  onRefresh,
  refreshing = false,
  useScrollView = true,
  avoidKeyboard = true,
  keyboardVerticalOffset,
}: ScreenWrapperProps) {
  const content = (
    <ScreenContent
      useScrollView={useScrollView}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      {children}
    </ScreenContent>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {showTopBar && (
        <ScreenTopBar
          title={title}
          showBackButton={showBackButton}
          onBackPress={onBackPress}
        />
      )}
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eee",
    overflow: "visible",
  },
  keyboardContainer: {
    flex: 1,
  },
});

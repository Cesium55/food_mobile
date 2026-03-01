import { ReactNode } from "react";
import { StyleSheet } from "react-native";
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
}: ScreenWrapperProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {showTopBar && (
        <ScreenTopBar
          title={title}
          showBackButton={showBackButton}
          onBackPress={onBackPress}
        />
      )}
      <ScreenContent
        useScrollView={useScrollView}
        onRefresh={onRefresh}
        refreshing={refreshing}
      >
        {children}
      </ScreenContent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eee",
    overflow: "visible",
  },
});

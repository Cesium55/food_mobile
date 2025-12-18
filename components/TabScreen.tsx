import { IconSymbol } from "@/components/ui/icon-symbol";
import { spacing, typography } from "@/constants/tokens";
import { useColors } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TabScreenProps {
  title: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
}

export function TabScreen({ 
  title, 
  children, 
  showBackButton = false,
  onBackPress,
  onRefresh,
  refreshing = false,
}: TabScreenProps) {
  const colors = useColors();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.default }]} edges={['top']}>
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackPress || (() => router.back())}
          >
            <IconSymbol 
              name="arrow.left" 
              color={colors.text.primary}
            />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>
      </View>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary[500]}
              colors={[colors.primary[500]]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    textAlignVertical: 'center',
  },
  backButton: {
    position: 'absolute',
    left: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    position: 'absolute',
  },
});

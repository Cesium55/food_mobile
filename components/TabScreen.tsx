import { TopBar } from "@/components/TopBar";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { spacing, typography } from "@/constants/tokens";
import { useColors } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import { useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
interface TabScreenProps {
  title?: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onRefresh?: () => Promise<void> | void;
  refreshing?: boolean;
  showTopBar?: boolean;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  useScrollView?: boolean;
}

export function TabScreen({ 
  title, 
  children, 
  showBackButton = false,
  onBackPress,
  onRefresh,
  refreshing = false,
  showTopBar = true,
  searchValue,
  onSearchChange,
  useScrollView = true,
}: TabScreenProps) {
  const colors = useColors();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const styles = createStyles(colors, insets.top);

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {useScrollView ? (
        <>
          {showTopBar && (
            <View style={styles.topBarWrapper}>
              <TopBar 
                searchValue={searchValue}
                onSearchChange={onSearchChange}
              />
            </View>
          )}
          {!showTopBar && title && (
            <View style={[styles.headerWrapper, { backgroundColor: colors.background.default }]}>
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
            </View>
          )}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={[styles.scrollContent, showTopBar && styles.scrollContentWithTopBar]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing || isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary[500]}
                  colors={[colors.primary[500]]}
                  progressViewOffset={showTopBar ? 50 : 0}
                />
              ) : undefined
            }
          >
            <View style={styles.contentWrapper}>
              {children}
            </View>
          </ScrollView>
        </>
      ) : (
        <>
          <View style={[styles.contentWrapper, { paddingTop: showTopBar ? insets.top : 0 }]}>
            {children}
          </View>
          {showTopBar && (
            <View style={styles.topBarAbsolute}>
              <TopBar 
                searchValue={searchValue}
                onSearchChange={onSearchChange}
              />
            </View>
          )}
          {!showTopBar && title && (
            <View style={[styles.header, styles.headerAbsolute]}>
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
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any, topInset: number) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eee',
    overflow: 'visible',
  },
  topBarWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
    paddingTop: 20,
    backgroundColor: colors.background.default,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
    paddingTop: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  contentWrapper: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 40,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  topBarAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    textAlignVertical: 'center',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
  scrollContentWithTopBar: {
    paddingTop: 40,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    flex: 1,
  },
});

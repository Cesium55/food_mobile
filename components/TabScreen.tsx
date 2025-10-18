import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface TabScreenProps {
  title: string;
  children?: React.ReactNode;
  showBackButton?: boolean;
}

export function TabScreen({ title, children, showBackButton = false }: TabScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol 
              name="arrow.left" 
              // size={24} 
              color={styles.backButtonIcon.color}
              
            />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        
      </View>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
    // paddingVertical: 16,
    paddingBottom: 32,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    textAlignVertical: 'center',
    // borderWidth: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    // borderWidth: 1,
    position: 'absolute',
  },
  backButtonIcon: {
    color: '#123123',
  },
});

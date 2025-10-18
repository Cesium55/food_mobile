import { IconSymbol } from "@/components/ui/icon-symbol";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

interface FullWidthLinkProps {
  href: string;
  iconName: string;
  text: string;
}

export function FullWidthLink({ href, iconName, text }: FullWidthLinkProps) {
  return (
    <Link href={href as any} style={styles.link}>
      <View style={styles.container}>
        <IconSymbol 
          name={iconName}
          color="#333"
          size={32}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={styles.text}>{text}</Text>
        </View>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderWidth: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    textAlignVertical: 'center',
    padding: 16,
    width: '100%',
  },
  icon: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 16,
  },
  textContainer: {
    marginLeft: 36,
  },
  text: {
    fontSize: 24,
  },
});

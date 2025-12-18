import { typography } from '@/constants/tokens';
import { useColors } from '@/contexts/ThemeContext';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const colors = useColors();
  
  // Используем переданный цвет или цвет из темы
  const color = lightColor || colors.text.primary;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link(colors) : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    fontFamily: typography.fontFamily.regular,
  },
  defaultSemiBold: {
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.base,
    fontFamily: typography.fontFamily.semibold,
  },
  title: {
    fontSize: typography.fontSize.huge,
    lineHeight: typography.lineHeight.huge,
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    fontSize: typography.fontSize.xl,
    lineHeight: typography.lineHeight.xl,
    fontFamily: typography.fontFamily.bold,
  },
});

// Динамические стили, зависящие от темы
const styles_dynamic = {
  link: (colors: any) => ({
    lineHeight: typography.lineHeight.xl,
    fontSize: typography.fontSize.base,
    color: colors.text.link,
  }),
};

// Объединяем статические и динамические стили
const styles_combined = {
  ...styles,
  link: styles_dynamic.link,
};

// Переопределяем styles для использования комбинированных стилей
Object.assign(styles, styles_combined);

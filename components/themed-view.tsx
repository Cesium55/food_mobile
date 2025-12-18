import { useColors } from '@/contexts/ThemeContext';
import { View, type ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colors = useColors();
  
  // Используем переданные цвета или цвета из темы
  const backgroundColor = lightColor || colors.background.default;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

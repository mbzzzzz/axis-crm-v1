import { View, Text } from "react-native";
import { AxisLogo } from "./AxisLogo";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  horizontalPadding?: number;
}

export function AppHeader({ title, subtitle, showLogo = false, horizontalPadding = 24 }: AppHeaderProps) {
  return (
    <View className="pt-4 pb-6" style={{ paddingHorizontal: horizontalPadding }}>
      {showLogo && (
        <View className="mb-4 items-center">
          <AxisLogo variant="icon" size="md" />
        </View>
      )}
      {title && (
        <Text className="text-2xl font-bold text-white mb-1">
          {title}
        </Text>
      )}
      {subtitle && (
        <Text className="text-sm text-neutral-400">
          {subtitle}
        </Text>
      )}
    </View>
  );
}


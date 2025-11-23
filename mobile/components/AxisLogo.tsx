import { Image, View, Text } from "react-native";

interface AxisLogoProps {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 56, height: 56 },
  lg: { width: 180, height: 180 },
};

const fullLogoSizeMap = {
  sm: { width: 140, height: 50 },
  md: { width: 180, height: 64 },
  lg: { width: 180, height: 350 },
};

export function AxisLogo({ 
  variant = "full", 
  size = "md",
  showText = false 
}: AxisLogoProps) {
  if (variant === "icon") {
    const dimensions = sizeMap[size];
    return (
      <View style={{ height: dimensions.height, width: dimensions.width }}>
        <Image
          source={require("../assets/icon.png")}
          style={{ height: dimensions.height, width: dimensions.width }}
          resizeMode="contain"
        />
      </View>
    );
  }

  const dimensions = fullLogoSizeMap[size];
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ height: dimensions.height, width: dimensions.width }}>
        <Image
          source={require("../assets/logo-full.png")}
          style={{ height: dimensions.height, width: dimensions.width }}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <Text className="text-base text-neutral-400 text-center mt-2">
          Tenant Portal
        </Text>
      )}
    </View>
  );
}


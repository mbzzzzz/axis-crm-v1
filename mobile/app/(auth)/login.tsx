import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Mail, Lock } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AxisLogo } from "../../components/AxisLogo";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://axis-crm-v1.vercel.app";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      // Call tenant authentication API
      const response = await fetch(`${API_BASE_URL}/api/auth/tenant/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store auth token
        await AsyncStorage.setItem("tenant_token", data.token);
        await AsyncStorage.setItem("tenant_id", String(data.tenant.id));
        await AsyncStorage.setItem("tenant_email", data.tenant.email);
        
        // Navigate to home
        router.replace("/(tabs)");
      } else {
        Alert.alert("Login Failed", data.error || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Failed to connect to server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 items-center justify-center px-6 py-12">
            {/* Logo Section */}
            <View className="mb-12 items-center">
              <AxisLogo variant="full" size="lg" showText={true} />
            </View>

            {/* Login Card */}
            <View className="w-full max-w-md">
              <View className="rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-xl p-6 shadow-2xl">
                <Text className="text-xl font-bold text-white mb-2 text-center">
                  Sign In
                </Text>
                <Text className="text-sm text-neutral-400 mb-6 text-center">
                  Sign in to your account to continue
                </Text>

                {/* Email Input */}
                <View className="mb-4">
                  <View className="relative">
                    <View className="absolute left-3 top-1/2 z-10" style={{ transform: [{ translateY: -10 }] }}>
                      <Mail size={20} color="#a1a1aa" />
                    </View>
                    <TextInput
                      className="w-full rounded-lg border border-neutral-800 bg-white/10 px-10 py-4 text-white"
                      style={{ color: "#ffffff" }}
                      placeholder="Email"
                      placeholderTextColor="#71717a"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View className="mb-6">
                  <View className="relative">
                    <View className="absolute left-3 top-1/2 z-10" style={{ transform: [{ translateY: -10 }] }}>
                      <Lock size={20} color="#a1a1aa" />
                    </View>
                    <TextInput
                      className="w-full rounded-lg border border-neutral-800 bg-white/10 px-10 py-4 text-white"
                      style={{ color: "#ffffff" }}
                      placeholder="Password"
                      placeholderTextColor="#71717a"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoComplete="password"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  className="w-full rounded-lg bg-white py-4 items-center justify-center mb-4"
                  activeOpacity={0.8}
                >
                  <Text className="text-base font-bold text-black">
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Text>
                </TouchableOpacity>

                {/* Help Text */}
                <Text className="text-xs text-neutral-500 text-center mt-4">
                  Contact your property manager if you need access
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DollarSign, Wrench, Mail, AlertCircle } from "lucide-react-native";
import { Alert } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://axis-crm-v1.vercel.app";

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone?: string;
  propertyId?: number;
  property?: {
    id: number;
    title: string;
    address: string;
    images?: string[];
  };
}

interface Invoice {
  id: number;
  totalAmount: number;
  paymentStatus: string;
  invoiceDate: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      const token = await AsyncStorage.getItem("tenant_token");
      const tenantId = await AsyncStorage.getItem("tenant_id");
      const email = await AsyncStorage.getItem("tenant_email");

      if (!token || !tenantId) {
        router.replace("/(auth)/login");
        return;
      }

      // Fetch tenant data
      const tenantResponse = await fetch(
        `${API_BASE_URL}/api/tenants/mobile?id=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        // Ensure tenant has a property assigned
        if (!tenantData.property) {
          Alert.alert(
            "No Property",
            "You don't have a property assigned. Please contact your property manager.",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
          );
          return;
        }
        setTenant(tenantData);
      } else {
        // Handle error - tenant not found or no property
        const errorData = await tenantResponse.json();
        if (errorData.code === 'NO_PROPERTY' || errorData.code === 'PROPERTY_NOT_FOUND') {
          Alert.alert(
            "No Property",
            "You don't have a property assigned. Please contact your property manager.",
            [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
          );
          return;
        }
      }

      // Fetch invoices to calculate balance
      const invoicesResponse = await fetch(
        `${API_BASE_URL}/api/invoices/mobile?tenantEmail=${encodeURIComponent(email || "")}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (invoicesResponse.ok) {
        const invoices = await invoicesResponse.json();
        const unpaidInvoices = invoices.filter(
          (inv: Invoice) => inv.paymentStatus === "unpaid" || inv.paymentStatus === "overdue"
        );
        const balance = unpaidInvoices.reduce(
          (sum: number, inv: Invoice) => sum + inv.totalAmount,
          0
        );
        setCurrentBalance(balance);
      }
    } catch (error) {
      console.error("Failed to load tenant data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold text-white mb-1">
            Welcome, {tenant?.name || "Tenant"}
          </Text>
          <Text className="text-sm text-neutral-400">
            {tenant?.property?.address || "No property assigned"}
          </Text>
        </View>

        {/* Property Hero Image */}
        {tenant?.property?.images?.[0] && (
          <View className="px-6 mb-6">
            <View className="relative rounded-2xl overflow-hidden h-64">
              <Image
                source={{ uri: tenant.property.images[0] }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.8)" }} />
              <View className="absolute bottom-4 left-4 right-4">
                <Text className="text-white text-lg font-bold mb-1">
                  {tenant.property.title || tenant.property.address}
                </Text>
                <Text className="text-white/80 text-sm">
                  {tenant.property.address}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Current Balance Card */}
        <View className="px-6 mb-6">
          <View
            className={`rounded-2xl p-6 ${
              currentBalance > 0
                ? "bg-red-950/50 border border-red-800"
                : "bg-green-950/50 border border-green-800"
            }`}
          >
            <Text className="text-sm text-neutral-400 mb-2">Current Balance</Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-4xl font-black text-white mr-2">
                ${currentBalance.toLocaleString()}
              </Text>
            </View>
            {currentBalance > 0 ? (
              <View className="flex-row items-center">
                <AlertCircle size={16} color="#ef4444" />
                <Text className="text-red-400 text-sm ml-2 font-semibold">
                  Payment Required
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <View className="size-2 rounded-full bg-green-400 mr-2" />
                <Text className="text-green-400 text-sm font-semibold">
                  All Paid
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-white mb-4">Quick Actions</Text>
          <View className="flex-row justify-around">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/payments")}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="size-16 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center mb-2">
                <DollarSign size={24} color="#ffffff" />
              </View>
              <Text className="text-white text-sm font-medium">Pay Rent</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(tabs)/maintenance")}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="size-16 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center mb-2">
                <Wrench size={24} color="#ffffff" />
              </View>
              <Text className="text-white text-sm font-medium">Request Repair</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                // TODO: Implement contact agent
                Alert.alert("Contact", "Feature coming soon");
              }}
              className="items-center"
              activeOpacity={0.7}
            >
              <View className="size-16 rounded-full bg-neutral-900 border border-neutral-800 items-center justify-center mb-2">
                <Mail size={24} color="#ffffff" />
              </View>
              <Text className="text-white text-sm font-medium">Contact Agent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


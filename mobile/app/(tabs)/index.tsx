import { View, Text, ScrollView, Image, TouchableOpacity, useWindowDimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DollarSign, Wrench, Mail, AlertCircle } from "lucide-react-native";
import { Alert } from "react-native";
import { AppHeader } from "../../components/AppHeader";
import { AxisLogo } from "../../components/AxisLogo";

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaseState, setLeaseState] = useState<"loading" | "active" | "inactive">("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const [tenantName, setTenantName] = useState("Tenant");
  const [tenantEmail, setTenantEmail] = useState("");
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const horizontalPadding = isLargeScreen ? 48 : 24;
  const heroHeight = isLargeScreen ? 320 : 240;
  const actionCircleSize = isLargeScreen ? 72 : 60;

  const quickActions = [
    {
      label: "Pay Rent",
      icon: DollarSign,
      action: () => router.push("/(tabs)/payments"),
    },
    {
      label: "Request Repair",
      icon: Wrench,
      action: () => router.push("/(tabs)/maintenance"),
    },
    {
      label: "Contact Agent",
      icon: Mail,
      action: () => {
        Alert.alert("Contact Agent", "Feature coming soon. Please reach out to your agent via email or phone.");
      },
    },
  ];

  const handleLogout = useCallback(async () => {
    await AsyncStorage.multiRemove(["tenant_token", "tenant_id", "tenant_email", "tenant_name"]);
    router.replace("/(auth)/login");
  }, [router]);

  const loadTenantData = useCallback(
    async ({ isPullToRefresh = false }: { isPullToRefresh?: boolean } = {}) => {
      try {
        if (isPullToRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const [[, token], [, tenantId], [, email], [, storedName]] = await AsyncStorage.multiGet([
          "tenant_token",
          "tenant_id",
          "tenant_email",
          "tenant_name",
        ]);

        if (!token || (!tenantId && !email)) {
          await handleLogout();
          return;
        }

        if (storedName) {
          setTenantName(storedName);
        }
        if (email) {
          setTenantEmail(email);
        }

        const tenantResponse = await fetch(
          `${API_BASE_URL}/api/tenants/mobile?email=${encodeURIComponent(email || "")}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          if (!tenantData.property) {
            setLeaseState("inactive");
            setStatusMessage("No property assigned. Please contact your property manager.");
            setTenant(tenantData);
            setCurrentBalance(0);
            return;
          }
          setTenant(tenantData);
          setTenantName(tenantData.name || storedName || "Tenant");
          setLeaseState("active");
          setStatusMessage("");
        } else {
          const errorData = await tenantResponse.json().catch(() => ({}));
          if (
            tenantResponse.status === 404 &&
            (errorData.code === "NO_PROPERTY" || errorData.code === "PROPERTY_NOT_FOUND" || errorData.code === "LEASE_TERMINATED")
          ) {
            setLeaseState("inactive");
            setStatusMessage(
              errorData.error ||
                "Your lease is inactive. Please contact your property manager for next steps."
            );
            setTenant(errorData.tenant || null);
            setCurrentBalance(0);
            return;
          }
          if (tenantResponse.status === 401 || tenantResponse.status === 403) {
            Alert.alert("Session expired", "Please sign in again.", [
              { text: "OK", onPress: () => handleLogout() },
            ]);
            return;
          }
          throw new Error(errorData.error || "Failed to load tenant details");
        }

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
        } else if (invoicesResponse.status === 401) {
          await handleLogout();
        }
      } catch (error) {
        console.error("Failed to load tenant data:", error);
        if (!isPullToRefresh) {
          Alert.alert("Error", "Unable to load your dashboard. Pull to refresh to try again.");
        }
      } finally {
        if (isPullToRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [handleLogout]
  );

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  const handleRefresh = useCallback(() => {
    loadTenantData({ isPullToRefresh: true });
  }, [loadTenantData]);

  if (isLoading && leaseState === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoading && leaseState === "inactive") {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: 48,
            paddingBottom: 64,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#fff" />}
        >
          <View className="items-center mb-8">
            <AxisLogo variant="full" size={width >= 768 ? "lg" : "md"} showText />
          </View>
          <Text className="text-3xl font-bold text-white text-center mb-3">
            Lease Access Inactive
          </Text>
          <Text className="text-neutral-400 text-center mb-8">
            {statusMessage ||
              "Your property manager has deactivated your access. Reach out to them if you believe this is a mistake."}
          </Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-full rounded-2xl bg-white py-4 items-center justify-center"
            activeOpacity={0.85}
          >
            <Text className="text-base font-semibold text-black">Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#ffffff" />}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        <AppHeader
          showLogo
          title={`Welcome, ${tenantName}`}
          subtitle={tenant?.property?.address || "Manage your lease, payments, and maintenance."}
          horizontalPadding={horizontalPadding}
        />

        {/* Property Hero Image */}
        {tenant?.property && (
          <View className="mb-6" style={{ paddingHorizontal: horizontalPadding }}>
            <View className="relative rounded-3xl overflow-hidden" style={{ height: heroHeight }}>
              {tenant.property.images?.[0] ? (
                <Image
                  source={{ uri: tenant.property.images[0] }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 bg-neutral-950 items-center justify-center">
                  <AxisLogo variant="icon" size={isLargeScreen ? "lg" : "md"} />
                </View>
              )}
              <View className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.65)" }} />
              <View className="absolute bottom-6 left-6 right-6">
                <Text className="text-white text-xl font-bold mb-1">
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
        <View className="mb-6" style={{ paddingHorizontal: horizontalPadding }}>
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
        <View className="mb-6" style={{ paddingHorizontal: horizontalPadding }}>
          <Text className="text-lg font-bold text-white mb-4">Quick Actions</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {quickActions.map(({ label, icon: Icon, action }) => (
              <TouchableOpacity
                key={label}
                onPress={action}
                activeOpacity={0.75}
                style={{
                  width: isLargeScreen ? "30%" : "31%",
                  marginBottom: 16,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: actionCircleSize,
                    height: actionCircleSize,
                    borderRadius: actionCircleSize / 2,
                    borderWidth: 1,
                    borderColor: "#27272a",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Icon size={isLargeScreen ? 28 : 24} color="#ffffff" />
                </View>
                <Text className="text-white text-sm font-medium text-center">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


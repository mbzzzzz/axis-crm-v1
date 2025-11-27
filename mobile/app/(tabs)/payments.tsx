import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FileText, Download, CheckCircle, AlertCircle } from "lucide-react-native";
import { AppHeader } from "../../components/AppHeader";
import { AxisLogo } from "../../components/AxisLogo";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://axis-crm-v1.vercel.app";

interface Invoice {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paymentStatus: string;
}

export default function PaymentsScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 768 ? 32 : 24;

  const loadInvoices = useCallback(
    async ({ isPullToRefresh = false }: { isPullToRefresh?: boolean } = {}) => {
      try {
        if (isPullToRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const [[, token], [, email]] = await AsyncStorage.multiGet(["tenant_token", "tenant_email"]);

        if (!token || !email) {
          setStatusMessage("Please sign in again to view your invoices.");
          setInvoices([]);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/invoices/mobile?tenantEmail=${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setInvoices(Array.isArray(data) ? data : []);
          setStatusMessage("");
        } else if (response.status === 401) {
          setStatusMessage("Session expired. Please log in again.");
          setInvoices([]);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setStatusMessage(errorData.error || "Unable to load invoices right now.");
          setInvoices([]);
        }
      } catch (error) {
        console.error("Failed to load invoices:", error);
        setStatusMessage("Unable to load invoices. Please try again.");
        setInvoices([]);
      } finally {
        if (isPullToRefresh) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleRefresh = () => {
    loadInvoices({ isPullToRefresh: true });
  };

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      const token = await AsyncStorage.getItem("tenant_token");
      const response = await fetch(
        `${API_BASE_URL}/api/invoices/${invoiceId}/pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // For now, open PDF in browser
        // TODO: Implement proper PDF download and sharing
        const pdfUrl = `${API_BASE_URL}/api/invoices/${invoiceId}/pdf`;
        Alert.alert(
          "Download PDF",
          "PDF download feature coming soon. For now, please use the web portal.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", "Failed to download PDF");
      }
    } catch (error) {
      console.error("Failed to download PDF:", error);
      Alert.alert("Error", "Failed to download PDF");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} color="#16a34a" />;
      case "overdue":
        return <AlertCircle size={16} color="#ef4444" />;
      default:
        return <FileText size={16} color="#eab308" />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <AppHeader
        showLogo
        title="Payments"
        subtitle="View and download your invoices"
        horizontalPadding={horizontalPadding}
      />

      {/* Invoices List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white">Loading...</Text>
        </View>
      ) : invoices.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <AxisLogo variant="icon" size="lg" />
          <Text className="text-neutral-400 text-center mt-4">
            {statusMessage || "No invoices found"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingBottom: 120,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#ffffff" />
          }
          renderItem={({ item }) => (
            <View className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base mb-1">
                    Invoice #{item.invoiceNumber}
                  </Text>
                  <Text className="text-neutral-400 text-sm">
                    Due: {new Date(item.dueDate).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  className={`px-2 py-1 rounded-full flex-row items-center ${getStatusColor(
                    item.paymentStatus
                  )}`}
                >
                  {getStatusIcon(item.paymentStatus)}
                  <Text className="text-xs font-medium ml-1 capitalize">
                    {item.paymentStatus}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between pt-3 border-t border-neutral-800">
                <Text className="text-white font-bold text-lg">
                  ${item.totalAmount.toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDownloadPDF(item.id)}
                  className="flex-row items-center bg-neutral-800 px-4 py-2 rounded-lg"
                  activeOpacity={0.7}
                >
                  <Download size={16} color="#ffffff" />
                  <Text className="text-white text-sm font-medium ml-2">
                    PDF
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}


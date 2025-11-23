import { View, Text, TouchableOpacity, FlatList, Modal, TextInput, Alert, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Plus, Wrench, Clock, CheckCircle, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://axis-crm-v1.vercel.app";

interface MaintenanceRequest {
  id: number;
  title: string;
  description: string;
  status: string;
  urgency: string;
  reportedDate: string;
}

export default function MaintenanceScreen() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    imageUri: null as string | null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMaintenanceRequests();
  }, []);

  const loadMaintenanceRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("tenant_token");
      const tenantId = await AsyncStorage.getItem("tenant_id");

      if (!token || !tenantId) return;

      const response = await fetch(
        `${API_BASE_URL}/api/maintenance/mobile?tenantId=${tenantId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to load maintenance requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "closed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "closed":
        return <CheckCircle size={16} color="#16a34a" />;
      case "in_progress":
        return <Clock size={16} color="#eab308" />;
      default:
        return <Wrench size={16} color="#3b82f6" />;
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setNewRequest({ ...newRequest, imageUri: result.assets[0].uri });
    }
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      Alert.alert("Error", "Please fill in both title and description");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem("tenant_token");
      const response = await fetch(`${API_BASE_URL}/api/maintenance/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newRequest.title.trim(),
          description: newRequest.description.trim(),
          imageUri: newRequest.imageUri,
        }),
      });

      if (response.ok) {
        Alert.alert(
          "Success", 
          "Maintenance request submitted successfully. Your property manager will be notified.",
          [{ text: "OK" }]
        );
        setNewRequest({ title: "", description: "", imageUri: null });
        setIsModalOpen(false);
        loadMaintenanceRequests();
      } else {
        const error = await response.json();
        if (error.code === 'NO_PROPERTY') {
          Alert.alert(
            "No Property",
            "You don't have a property assigned. Please contact your property manager.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert("Error", error.error || "Failed to submit request");
        }
      }
    } catch (error) {
      console.error("Failed to submit request:", error);
      Alert.alert("Error", "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-6 border-b border-neutral-800">
          <Text className="text-2xl font-bold text-white mb-1">
            Maintenance Requests
          </Text>
          <Text className="text-sm text-neutral-400">
            Track and manage your repair requests
          </Text>
        </View>

        {/* Requests List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-white">Loading...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Wrench size={48} color="#71717a" />
            <Text className="text-neutral-400 text-center mt-4">
              No maintenance requests yet
            </Text>
            <Text className="text-neutral-500 text-sm text-center mt-2">
              Tap the + button to create a new request
            </Text>
          </View>
        ) : (
          <FlatList
            data={requests}
            keyExtractor={(item) => String(item.id)}
            contentContainerClassName="p-6"
            renderItem={({ item }) => (
              <View className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-white font-semibold text-base flex-1">
                    {item.title}
                  </Text>
                  <View
                    className={`px-2 py-1 rounded-full flex-row items-center ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {getStatusIcon(item.status)}
                    <Text className="text-xs font-medium ml-1 capitalize">
                      {item.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>
                <Text className="text-neutral-400 text-sm mb-3" numberOfLines={2}>
                  {item.description}
                </Text>
                <Text className="text-neutral-500 text-xs">
                  Reported: {new Date(item.reportedDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          />
        )}

        {/* Floating Action Button */}
        <TouchableOpacity
          onPress={() => setIsModalOpen(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white items-center justify-center shadow-lg"
          activeOpacity={0.8}
        >
          <Plus size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Create Request Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-neutral-800">
              <Text className="text-xl font-bold text-white">New Request</Text>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                className="p-2"
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
              {/* Title Input */}
              <View className="mb-4">
                <Text className="text-white font-medium mb-2">Title</Text>
                <TextInput
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white"
                  placeholder="e.g., Leaky faucet in kitchen"
                  placeholderTextColor="#71717a"
                  value={newRequest.title}
                  onChangeText={(text) => setNewRequest({ ...newRequest, title: text })}
                />
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-white font-medium mb-2">Description</Text>
                <TextInput
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-white min-h-[120px]"
                  placeholder="Describe the issue in detail..."
                  placeholderTextColor="#71717a"
                  value={newRequest.description}
                  onChangeText={(text) => setNewRequest({ ...newRequest, description: text })}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Image Upload */}
              <View className="mb-6">
                <Text className="text-white font-medium mb-2">Photo (Optional)</Text>
                <TouchableOpacity
                  onPress={handlePickImage}
                  className="w-full h-48 rounded-lg border-2 border-dashed border-neutral-700 bg-neutral-900 items-center justify-center"
                  activeOpacity={0.7}
                >
                  {newRequest.imageUri ? (
                    <Image
                      source={{ uri: newRequest.imageUri }}
                      className="w-full h-full rounded-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <>
                      <View className="size-12 rounded-full bg-neutral-800 items-center justify-center mb-2">
                        <Plus size={24} color="#ffffff" />
                      </View>
                      <Text className="text-neutral-400 text-sm">Tap to Upload Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmitRequest}
                disabled={isSubmitting}
                className="w-full rounded-lg bg-white py-4 items-center justify-center mb-6"
                activeOpacity={0.8}
              >
                <Text className="text-base font-bold text-black">
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}


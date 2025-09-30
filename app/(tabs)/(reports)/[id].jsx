import { db } from "@/api/config/firebase.config";
import { Box } from "@/components/ui/box";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, Info, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Text as RNText,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

export default function ReportDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const openImageModal = (uri) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    setSelectedImage(null);
  };

  useEffect(() => {
    if (id) {
      const fetchReport = async () => {
        setLoading(true);
        const docRef = doc(db, "allReports", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setReport({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
        setLoading(false);
      };

      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center bg-[#D9E9DD]">
        <ActivityIndicator size="large" />
        <RNText>Loading report...</RNText>
      </Box>
    );
  }

  if (!report) {
    return (
      <Box className="flex-1 justify-center items-center bg-[#D9E9DD]">
        <RNText>Report not found.</RNText>
      </Box>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#D9E9DD]">
      {/* Header */}
      <View className="bg-[#D9E9DD] px-4 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={require("@/assets/images/ariba-logo.png")}
              style={{ width: 50, height: 50, marginRight: 8 }}
              resizeMode="contain"
            />
            <RNText className="text-2xl font-extrabold text-black">
              NOTIFICATION
            </RNText>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-xl p-4 shadow-md">
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center mb-4"
          >
            <ChevronLeft size={24} color="black" />
            <RNText className="text-lg font-bold ml-1">BACK</RNText>
          </TouchableOpacity>

          {/* Report Title */}
          <RNText className="text-3xl font-bold mb-2">{report.title}</RNText>

          {/* Report Description */}
          <View className="bg-gray-100 p-3 rounded-lg mb-6">
            <RNText className="text-base text-gray-700">
              {report.description}
            </RNText>
          </View>

          {/* Status */}
          <View className="items-center mb-6">
            <RNText className="text-lg font-bold">
              THIS REPORT IS CURRENTLY
            </RNText>
            <RNText
              className="text-2xl font-bold"
              style={{
                color:
                  report.status?.toLowerCase() === "pending"
                    ? "#EAB308" // Yellow for Pending
                    : report.status?.toLowerCase() === "responded"
                    ? "#16A34A" // Green for Responded
                    : "#DC2626", // Red for Ignored
              }}
            >
              {report.status?.toUpperCase()}
            </RNText>
          </View>

          {/* Tier List */}
          <View className="mb-6">
            <RNText className="text-lg font-bold mb-1">
              Report's Tier list
            </RNText>
            <RNText className="text-sm text-gray-500 mb-2">
              How urgent is the report?
            </RNText>
            <View className="flex-row items-center">
              <View className="flex-1 border border-gray-300 rounded-md p-3 bg-gray-50">
                <RNText className="text-base">{report.tier}</RNText>
              </View>
              <Info size={24} color="gray" className="ml-2" />
            </View>
          </View>

          {/* Attached Files */}
          <View>
            <RNText className="text-lg font-bold mb-2">Files Attached:</RNText>
            <View className="flex-row flex-wrap">
              {report.images && report.images.length > 0 ? (
                report.images.map((uri, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => openImageModal(uri)}
                  >
                    <Image
                      source={{ uri }}
                      className="w-24 h-24 rounded-md mr-2 mb-2 bg-gray-200"
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <RNText className="text-gray-500">No files attached.</RNText>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeImageModal}
      >
        <View
          className="flex-1 justify-center items-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <TouchableOpacity
            className="absolute top-10 right-5 z-10"
            onPress={closeImageModal}
          >
            <X size={32} color="white" />
          </TouchableOpacity>

          <Image
            source={{ uri: selectedImage }}
            style={{
              width: windowWidth * 0.9,
              height: windowHeight * 0.8,
            }}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

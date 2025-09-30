import { db } from "@/api/config/firebase.config";
import SearchBar from "@/components/inputs/searchbar/SearchBar";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  FileEdit,
  Info,
  Link,
  Save,
  Trash2
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function EditReport() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [report, setReport] = useState(null);
  const [title, setTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [description, setDescription] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [tier, setTier] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tierSaving, setTierSaving] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const tierOptions = [
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
    { label: "Emergency", value: "Emergency" },
  ];

  useEffect(() => {
    if (id) {
      const fetchReport = async () => {
        setLoading(true);
        const docRef = doc(db, "allReports", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const reportData = docSnap.data();
          setReport({ id: docSnap.id, ...reportData });
          setTitle(reportData.title);
          setOriginalTitle(reportData.title);
          setDescription(reportData.description);
          setOriginalDescription(reportData.description);
          setTier(reportData.tier);
          setImages(reportData.images || []);
        } else {
          Alert.alert("Error", "Report not found.");
          router.back();
        }
        setLoading(false);
      };

      fetchReport();
    }
  }, [id]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  // Handle dynamic tier saving
  const handleTierChange = async (value) => {
    if (!value || value === "") return;
    
    setTierSaving(true);
    setShowTierModal(false);
    const previousTier = tier;
    setTier(value);

    try {
      const docRef = doc(db, "allReports", id);
      await updateDoc(docRef, { tier: value });
      Alert.alert("Success", "Tier updated successfully!");
    } catch (error) {
      setTier(previousTier);
      console.error("Error updating tier: ", error);
      Alert.alert("Error", "Failed to update tier. Please try again.");
    } finally {
      setTierSaving(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!title || !description || !tier) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }

    setSaving(true);
    const docRef = doc(db, "allReports", id);

    try {
      await updateDoc(docRef, {
        title,
        description,
        tier,
      });
      Alert.alert("Success", "Report updated successfully.");
      router.back();
    } catch (error) {
      console.error("Error updating report: ", error);
      Alert.alert("Error", "Failed to update report.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDescription = () => {
    Alert.alert(
      "Delete Description",
      "Are you sure you want to clear the description?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => setDescription(""),
        },
      ]
    );
  };

  const handleEditTitle = () => {
    if (isEditingTitle) {
      // This is now the 'Save' action
      if (title.trim() === "") {
        setTitle(originalTitle);
      }
    } else {
      // This is the 'Edit' action
      setIsEditingDescription(false);
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
    setIsEditingTitle(!isEditingTitle);
  };

  const handleEditDescription = () => {
    if (isEditingDescription) {
      // This is now the 'Save' action
      if (description.trim() === "") {
        setDescription(originalDescription);
      }
    } else {
      // This is the 'Edit' action
      setIsEditingTitle(false);
      setTimeout(() => descriptionInputRef.current?.focus(), 100);
    }
    setIsEditingDescription(!isEditingDescription);
  };

  if (loading) {
    return (
      <Box className="flex-1 justify-center items-center bg-[#D9E9DD]">
        <ActivityIndicator size="large" />
        <Text>Loading report...</Text>
      </Box>
    );
  }

  return (
    <GluestackUIProvider>
      <SafeAreaView className="flex-1 bg-[#D9E9DD]">
        <View className="px-4 pt-5 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={require("@/assets/images/ariba-logo.png")}
                style={{ width: 40, height: 40, marginRight: 8 }}
              />
              <Text className="text-2xl font-bold">NOTIFICATION</Text>
            </View>
          </View>
          <View className="flex-row justify-end mt-2 -mb-3">
            <Box className="w-48 h-12">
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
              />
            </Box>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View className="bg-white rounded-xl p-4 shadow-md">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-row items-center"
              >
                    <ChevronLeft size={24} color="black" />
                    <Text className="text-sm font-bold ml-1">BACK</Text>
                </TouchableOpacity>
                <Button onPress={handleSaveChanges} disabled={saving} className="bg-[#16A34A] rounded-lg w-30 h-8">
                    {saving ? <ActivityIndicator color="#fff" /> : <ButtonText>Save Changes</ButtonText>}
                </Button>
            </View>
          {/* Title */}
          <View className="flex-row items-center mb-4">
            <TextInput
              ref={titleInputRef}
              value={title}
              onChangeText={setTitle}
              className="text-3xl font-bold flex-1"
              editable={isEditingTitle}
              placeholder="Report Title"
            />
            {isEditingTitle ? (
              <TouchableOpacity
                onPress={handleEditTitle}
                className="flex-row items-center bg-green-600 p-2 rounded-lg ml-2"
              >
                <Save size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleEditTitle}
                className="flex-row items-center bg-[#16A34A] p-2 rounded-lg ml-2"
              >
                <FileEdit size={16} color="white" />
                <Text className="text-white ml-1 font-semibold whitespace-nowrap">Edit Title</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          <View className="bg-gray-100 p-3 rounded-lg mb-4">
            <TextInput
              ref={descriptionInputRef}
              value={description}
              onChangeText={setDescription}
              multiline
              className="text-base text-gray-700"
              style={{ height: 150, textAlignVertical: "top" }}
              editable={isEditingDescription}
              placeholder="Report Description"
            />
            <View className="flex-row self-end mt-2">
              {isEditingDescription ? (
                <TouchableOpacity
                  onPress={handleEditDescription}
                  className="p-2 bg-green-600 rounded-md mr-2"
                >
                  <Check size={15} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={handleEditDescription}
                  className="p-2 bg-[#16A34A] rounded-md mr-2"
                >
                  <FileEdit size={15} color="white" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDeleteDescription}
                className="p-2 bg-red-500 rounded-md"
              >
                <Trash2 size={15} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status */}
          <View className="items-center mb-6">
            <Text className="text-lg font-bold">
              THIS REPORT IS CURRENTLY
            </Text>
            <Text
              className="text-2xl font-bold"
              style={{
                color:
                  report.status?.toLowerCase() === "pending"
                    ? "#EAB308"
                    : report.status?.toLowerCase() === "responded"
                    ? "#16A34A"
                    : "#DC2626",
              }}
            >
              {report.status?.toUpperCase()}
            </Text>
          </View>

          {/* Tier */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-1">
              Edit Report's Tierlist
            </Text>
            <Text className="text-sm text-gray-500 mb-2">
              How urgent is the report?
            </Text>
            <View className="flex-row items-center">
              <View className="flex-1">
                <TouchableOpacity
                  onPress={() => setShowTierModal(true)}
                  className="border border-gray-300 rounded-md p-3 bg-gray-50 flex-row items-center justify-between mr-3"
                  disabled={tierSaving}
                >
                  <Text className={tier ? "text-black" : "text-gray-400"}>
                    {tier || "Select report tier"}
                  </Text>
                  <ChevronDown size={20} color="gray" />
                </TouchableOpacity>
              </View>
              {tierSaving ? (
                <ActivityIndicator size="small" color="#16A34A" style={{ marginLeft: 8 }} />
              ) : (
                <Info size={24} color="gray" className="ml-2" />
              )}
            </View>
          </View>

          {/* Tier Selection Modal */}
          <Modal
            visible={showTierModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowTierModal(false)}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={1}
              onPress={() => setShowTierModal(false)}
            >
              <View className="bg-white rounded-lg w-4/5 max-w-sm">
                <View className="bg-gray-200 p-3 rounded-t-lg">
                  <Text className="text-center text-gray-600 font-medium">Select report tier</Text>
                </View>
                {tierOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => handleTierChange(option.value)}
                    className="p-4 border-b border-gray-100"
                  >
                    <Text className="text-black text-base">{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Attached Files */}
          <View>
            <Text className="text-lg font-bold mb-2">Files Attached:</Text>
            <View className="flex-row flex-wrap">
              {images.map((uri, index) => (
                <TouchableOpacity key={index} onPress={() => setSelectedImage(uri)}>
                  <Image
                    key={index}
                    source={{ uri }}
                    className="w-24 h-24 rounded-md mr-2 mb-2 bg-gray-200"
                    style={{ borderWidth: selectedImage === uri ? 2 : 0, borderColor: '#16A34A' }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row mt-4">
              <TouchableOpacity
                // onPress={handleAddPhoto}
                className="flex-row items-center bg-green-600 p-2 rounded-lg mr-2"
              >
                <Link size={16} color="white" />
                <Text className="text-white ml-1 font-semibold">Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                // onPress={handleDeletePhoto}
                disabled={!selectedImage}
                className="flex-row items-center bg-red-500 p-2 rounded-lg"
              >
                <Trash2 size={16} color="white" />
                <Text className="text-white ml-1 font-semibold">Delete Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    </GluestackUIProvider>
  );
}
  
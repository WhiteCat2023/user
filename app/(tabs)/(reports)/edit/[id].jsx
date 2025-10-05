import { db } from "@/api/config/firebase.config";
import { deleteImageFromFirebase, uploadImagesToFirebase } from "@/api/services/firebase/storage.services";
import SearchBar from "@/components/inputs/searchbar/SearchBar";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import {
  Popover,
  PopoverArrow,
  PopoverBackdrop,
  PopoverBody,
  PopoverContent,
} from "@/components/ui/popover";
import * as ImagePicker from "expo-image-picker";
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
  Trash2,
  X
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
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedPhotosForDeletion, setSelectedPhotosForDeletion] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTierInfo, setShowTierInfo] = useState(false);

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
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error updating report: ", error);
      Alert.alert("Error", "Failed to update report.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
      setSelectedImage(null); // Clear single selection when entering delete mode
      return;
    }

    if (selectedPhotosForDeletion.length === 0) {
      Alert.alert("No Photos Selected", "Please select photos to delete.", [
        { text: "OK", onPress: () => setIsDeleteMode(false) },
      ]);
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete ${selectedPhotosForDeletion.length} photo(s)? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel", onPress: () => {
            setIsDeleteMode(false);
            setSelectedPhotosForDeletion([]);
        } },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              // Delete from Firebase Storage
              for (const imageUrl of selectedPhotosForDeletion) {
                await deleteImageFromFirebase(imageUrl);
              }

              // Update component state
              const remainingImages = images.filter(
                (img) => !selectedPhotosForDeletion.includes(img)
              );
              setImages(remainingImages);

              // Update Firestore
              const docRef = doc(db, "allReports", id);
              await updateDoc(docRef, { images: remainingImages });

              
            } catch (error) {
              console.error("Error deleting photos: ", error);
              Alert.alert(
                "Error",
                "Failed to delete photos. Please try again."
              );
            } finally {
              setSaving(false);
              setIsDeleteMode(false);
              setSelectedPhotosForDeletion([]);
            }
          },
        },
      ]
    );
  };

  const handleSelectImageForDeletion = (imageUrl) => {
    setSelectedPhotosForDeletion((prevSelected) => {
      if (prevSelected.includes(imageUrl)) {
        return prevSelected.filter((url) => url !== imageUrl);
      } else {
        return [...prevSelected, imageUrl];
      }
    });
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

  const handleAddPhoto = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to add an image."
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (pickerResult.canceled) {
      return;
    }

    setSaving(true);
    try {
      const { uri } = pickerResult.assets[0];
      const newImageUrls = await uploadImagesToFirebase([{ uri }], `reports/${id}`);

      if (newImageUrls && newImageUrls.length > 0) {
        const updatedImages = [...images, ...newImageUrls];
        setImages(updatedImages);

        const docRef = doc(db, "allReports", id);
        await updateDoc(docRef, { images: updatedImages });

      } else {
        throw new Error("Image upload returned no URL.");
      }
    } catch (error) {
      console.error("Error adding photo: ", error);
      Alert.alert("Error", "Failed to add photo. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.back();
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
                              <Popover
                isOpen={showTierInfo}
                onClose={() => setShowTierInfo(false)}
                onOpen={() => setShowTierInfo(true)}
                placement="top"
                trigger={(triggerProps) => {
                  return (
                    <TouchableOpacity {...triggerProps}>
                      <Info size={24} color="gray" className="ml-2" />
                    </TouchableOpacity>
                  );
                }}
              >
                <PopoverBackdrop />
                <PopoverContent className="mx-5 w-92 rounded-lg">
                  <PopoverArrow />
                  <PopoverBody>
                    <Text className="font-bold text-lg mb-2">Legend:</Text>
                    <View className="mb-1">
                      <Text>
                        <Text className="font-bold text-green-600">
                          Low
                        </Text>
                        - use this to identify that the report is in low
                        priority/not so important, can wait longer or just for
                        awareness, no action needed.
                      </Text>
                    </View>
                    <View className="mb-1">
                      <Text>
                        <Text className="font-bold text-yellow-500">
                          Medium
                        </Text>
                        - use this to identify that the report is of medium
                        priority, needs attention but not immediate action.
                      </Text>
                    </View>
                    <View className="mb-1">
                      <Text>
                        <Text className="font-bold text-orange-500">
                          High
                        </Text>
                        - use this to identify that the report is of high
                        priority, needs attention and action soon.
                      </Text>
                    </View>
                    <View>
                      <Text>
                        <Text className="font-bold text-red-600">
                          Emergency
                        </Text>
                        - use this to identify that the report is urgent and
                        needs immediate attention action.
                      </Text>
                    </View>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
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

          {/* Photos */}
          <View className="mb-4">
            <Text className="text-lg font-bold mb-2">Photos</Text>
            <View className="flex-row flex-wrap">
              {images.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (isDeleteMode) {
                      handleSelectImageForDeletion(imageUrl);
                    } else {
                      setSelectedImage(imageUrl);
                    }
                  }}
                  className="m-1"
                >
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-24 h-24 rounded-lg"
                  />
                  {isDeleteMode && (
                    <View
                      className={`absolute top-1 right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                        selectedPhotosForDeletion.includes(imageUrl)
                          ? "bg-red-500"
                          : "bg-gray-500/50"
                      }`}
                    >
                      <Check size={16} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row mt-4">
              <TouchableOpacity
                onPress={handleAddPhoto}
                className="flex-row items-center bg-[#16A34A] p-2 rounded-lg mr-2"
              >
                <Link size={16} color="white" />
                <Text className="text-white ml-1 font-semibold">Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeletePhoto}
                className={`flex-row items-center p-2 rounded-lg ${
                  isDeleteMode ? "bg-red-600" : "bg-red-500"
                }`}
              >
                <Trash2 size={16} color="white" />
                <Text className="text-white ml-1 font-semibold">
                  {isDeleteMode ? "Confirm Deletion" : "Delete Photo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Modal */}
          <Modal
            visible={!!selectedImage}
            transparent={true}
            onRequestClose={() => setSelectedImage(null)}
          >
            <View className="flex-1 bg-black/80 justify-center items-center">
              <TouchableOpacity
                className="absolute top-10 right-5"
                onPress={() => setSelectedImage(null)}
              >
                <Text className="text-white text-2xl">X</Text>
              </TouchableOpacity>
              <Image
                source={{ uri: selectedImage }}
                className="w-11/12 h-3/4"
                resizeMode="contain"
              />
            </View>
          </Modal>
          </View>
        </ScrollView>
        <Modal
            visible={showSuccessModal}
            transparent={true}
            animationType="fade"
            onRequestClose={handleSuccessModalClose}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '90%' }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', right: 10, top: 10 }}
                        onPress={handleSuccessModalClose}
                    >
                        <X size={24} color="black" />
                    </TouchableOpacity>
                    
                    <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 16 }}>
                        REPORT UPDATED
                    </Text>
            
                    <Image
                        source={require("@/assets/images/report-update.png")}
                        style={{ width: 90, height: 90, marginBottom: 16 }}
                        resizeMode="contain"
                    />
            
                    <Text style={{ fontSize: 18, marginBottom: 24, textAlign: 'center' }}>
                        Report Updated <Text style={{ fontWeight: 'bold', color: '#28a745' }}>Successfully!</Text>
                    </Text>
            
                    <TouchableOpacity
                        onPress={handleSuccessModalClose}
                        style={{ backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 8, alignItems: 'center', width: '100%' }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                            Okay
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      </SafeAreaView>
    </GluestackUIProvider>
  );
}

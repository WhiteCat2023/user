import { db } from "@/api/config/firebase.config";
import { changePassword } from "@/api/controller/auth.controller";
import { uploadImagesToFirebase } from "@/api/services/firebase/storage.services";
import { useAuth } from "@/context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { getAuth, updateProfile } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { LogOut, Pencil, Upload, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const router = useRouter();
  const { user, userDoc, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (userDoc) {
      setFirstName(userDoc.firstName || "");
      setLastName(userDoc.lastName || "");
    }
  }, [userDoc]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    // We can't verify old password on the client side with firebase auth
    // For now, we will just change the password
    const res = await changePassword(newPassword);
    if (res.status === 200) {
      alert("Password changed successfully!");
      setModalVisible(false);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  const handleSaveInformation = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "First name and last name cannot be empty.");
      return;
    }
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        firstName: firstName,
        lastName: lastName,
      });
      Alert.alert("Success", "Your information has been updated.");
    } catch (error) {
      console.error("Error updating user information: ", error);
      Alert.alert("Error", "Failed to update information. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleCoverPhotoChange = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to change the cover photo."
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (pickerResult.canceled) {
      return;
    }

    setIsUploadingCover(true);
    try {
      const { uri } = pickerResult.assets[0];
      const newImageUrls = await uploadImagesToFirebase(
        [{ uri }],
        `cover_photos/${user.uid}`
      );

      if (newImageUrls && newImageUrls.length > 0) {
        const coverPhotoURL = newImageUrls[0];
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { coverPhotoURL });
        Alert.alert("Success", "Cover photo updated successfully!");
      } else {
        throw new Error("Image upload returned no URL.");
      }
    } catch (error) {
      console.error("Error updating cover photo: ", error);
      Alert.alert("Error", "Failed to update cover photo. Please try again.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleProfilePhotoChange = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to change your profile picture."
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (pickerResult.canceled) {
      return;
    }

    setIsUploadingProfilePic(true);
    try {
      const { uri } = pickerResult.assets[0];
      const newImageUrls = await uploadImagesToFirebase(
        [{ uri }],
        `profile_pictures/${user.uid}`
      );

      if (newImageUrls && newImageUrls.length > 0) {
        const photoURL = newImageUrls[0];
        const auth = getAuth();
        await updateProfile(auth.currentUser, { photoURL });

        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { photoURL });

        Alert.alert("Success", "Profile picture updated successfully!");
      } else {
        throw new Error("Image upload returned no URL.");
      }
    } catch (error) {
      console.error("Error updating profile picture: ", error);
      Alert.alert(
        "Error",
        "Failed to update profile picture. Please try again."
      );
    } finally {
      setIsUploadingProfilePic(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0FDF4]">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header */}
        <View className="bg-[#F0FDF4] px-4 pt-5 pb-3">
          <View className="flex-row items-center">
            <Image
              source={require("@/assets/images/ariba-logo.png")}
              style={{ width: 50, height: 50, marginRight: 8 }}
              resizeMode="contain"
            />
            <View>
              <Text className="text-2xl font-extrabold text-black">
                PROFILE
              </Text>
              <Text className="text-sm text-gray-500">
                Manage Settings for your Profile
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4">
          {/* Profile Card */}
          <View className="bg-white rounded-2xl shadow-md p-4">
            <ImageBackground
              source={{ uri: userDoc?.coverPhotoURL }}
              className="h-32 bg-gray-300 rounded-t-xl -mt-4 -mx-4 overflow-hidden"
              resizeMode="cover"
            >
              <View className="flex-1 justify-center items-center">
                {isUploadingCover && (
                  <ActivityIndicator size="large" color="#fff" />
                )}
              </View>
              <TouchableOpacity
                onPress={handleCoverPhotoChange}
                className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full"
                disabled={isUploadingCover}
              >
                <Pencil size={18} color="#16A34A" />
              </TouchableOpacity>
            </ImageBackground>
            <View className="flex-row items-center -mt-16 px-4">
              <Image
                source={{ uri: user?.photoURL || "https://i.pravatar.cc/100" }}
                className="-ml-2 w-28 h-28 rounded-full border-4 border-white bg-gray-200"
              />
              <View className="ml-2">
                <Text className="text-2xl font-bold mt-20">
                  {userDoc?.firstName} {userDoc?.lastName}
                </Text>
                <TouchableOpacity
                  onPress={handleProfilePhotoChange}
                  disabled={isUploadingProfilePic}
                  className="flex-row items-center justify-center mt-2 bg-green-500 px-4 py-2 w-40 h-10 rounded-lg"
                >
                  {isUploadingProfilePic ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Upload size={14} color="white" className="mr-2" />
                      <Text className="text-white ml-2">Upload Image</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text className="text-xs text-gray-400 mt-1">
                  Supports PNGs, JPEG under 5mb
                </Text>
              </View>
            </View>

            {/* Account Information */}
            <View className="border-t border-gray-200 mt-6 pt-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-bold">Account Information</Text>
                <TouchableOpacity
                  onPress={() => {
                    if (isEditing) {
                      handleSaveInformation();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="bg-green-500 px-3 py-0.5 h-9 rounded-lg flex-row items-center"
                >
                  <Pencil size={12} color="white" className="mr-1" />
                  <Text className="text-white ml-1 text-xs">
                    {isEditing ? "Save" : "Edit Information"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mt-4">
                <Text className="text-sm text-gray-500">First Name</Text>
                <TextInput
                  value={firstName}
                  editable={isEditing}
                  onChangeText={setFirstName}
                  className={`border rounded-lg p-2 mt-1 ${
                    isEditing ? "border-gray-300" : "border-transparent bg-gray-100"
                  }`}
                />
              </View>
              <View className="mt-4">
                <Text className="text-sm text-gray-500">Last Name</Text>
                <TextInput
                  value={lastName}
                  editable={isEditing}
                  onChangeText={setLastName}
                  className={`border rounded-lg p-2 mt-1 ${
                    isEditing ? "border-gray-300" : "border-transparent bg-gray-100"
                  }`}
                />
              </View>
              <View className="mt-4">
                <Text className="text-sm text-gray-500">E-mail Address</Text>
                <TextInput
                  value={user?.email}
                  editable={false}
                  className="border border-gray-300 rounded-lg p-2 mt-1 bg-gray-100"
                />
              </View>
              <View className="mt-4">
                <Text className="text-sm text-gray-500">Mobile Number</Text>
                <TextInput
                  value={userDoc?.phoneNumber || "+09000000000"}
                  editable={isEditing}
                  className={`border rounded-lg p-2 mt-1 ${
                    isEditing ? "border-gray-300" : "border-transparent bg-gray-100"
                  }`}
                />
              </View>
              <Text className="text-xs text-gray-400 mt-2">
                You may need to log out and log back in to see changes.
              </Text>
            </View>

            <View className="border-t border-gray-200 mt-6 pt-4">
              <Text className="text-lg font-bold">Change Password</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="bg-green-500 mt-2 px-4 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Edit Password</Text>
              </TouchableOpacity>
            </View>

            <View className="border-t border-gray-200 mt-6 pt-4">
              <Text className="text-lg font-bold">Bookmarks</Text>
              <TouchableOpacity
                onPress={() => router.push("(tabs)/(profile)/bookmark")}
                className="bg-green-500 mt-2 px-4 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-bold">View all Bookmarks</Text>
              </TouchableOpacity>
            </View>

            <View className="border-t border-gray-200 mt-6 pt-4">
              <Text className="text-lg font-bold">Account Deletion</Text>
              <Text className="text-sm text-gray-600 mt-1">
                If you want to permanently delete this account and all of its
                data, you can do so below by clicking the "Delete Button".
              </Text>
              <TouchableOpacity className="bg-red-500 mt-4 px-4 py-3 rounded-lg items-center">
                <Text className="text-white font-bold">Delete Account</Text>
              </TouchableOpacity>
            </View>

            <View className="border-t border-gray-200 mt-6 pt-4">
              <TouchableOpacity
                onPress={logout}
                className="bg-gray-200 mt-2 px-4 py-3 rounded-lg items-center flex-row justify-center"
              >
                <LogOut size={18} color="black" className="mr-2" />
                <Text className="text-black font-bold">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white w-11/12 rounded-2xl p-6 shadow-lg">
            <TouchableOpacity
              className="absolute top-4 right-4"
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-center mb-4">
              CHANGE PASSWORD
            </Text>
            <View className="border-b-2 border-gray-200 mb-6" />

            <Text className="text-sm font-semibold mb-1">
              Confirm old Password
            </Text>
            <TextInput
              placeholder="Enter old password here"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4"
            />

            <Text className="text-sm font-semibold mb-1">
              Create new password
            </Text>
            <TextInput
              placeholder="Enter new password here"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              className="bg-gray-100 border border-gray-300 rounded-lg p-3"
            />
            <Text className="text-xs text-gray-500 mt-1 mb-4">
              Password must be in Alphanumeric 12 min character 1 Special
            </Text>

            <Text className="text-sm font-semibold mb-1">
              Confirm new password
            </Text>
            <TextInput
              placeholder="Confirm new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="bg-gray-100 border border-gray-300 rounded-lg p-3 mb-6"
            />

            <TouchableOpacity
              onPress={handlePasswordChange}
              className="bg-green-500 py-3 rounded-lg items-center"
            >
              <Text className="text-white font-bold text-lg">
                Change Password
              </Text>
            </TouchableOpacity>
            <Text className="text-xs text-gray-500 text-center mt-2">
              By clicking the change password we'll send email for confimation
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

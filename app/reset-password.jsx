import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Platform, SafeAreaView, Text, View } from "react-native";
import Button from "../components/ui/button/Button";
import { GoogleSignUpButton } from "../components/ui/button/googleAuthButtons";
import Input from "../components/ui/input/Input";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const handleResetPassword = () => {
    if (!password || !confirmPassword) {
      Alert.alert("Please fill in both fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }
    // Add reset password logic
    Alert.alert("Password reset successful!");
    router.push("/");
  };


  // ===== MOBILE VERSION =====
  if (!isWeb) {
    return (
  <SafeAreaView className="flex-1 bg-white justify-center px-6">
    <Text className="text-green-600 text-6xl mb-1 text-center font-[Pacifico]">
      Ariba
    </Text>
    <Text className="text-black text-base mb-8 text-center font-semibold">
      Locate - Report - Connect
    </Text>
    <Text className="text-black text-center mb-14">
      Create a new and strong password
    </Text>

    <Input
      placeholder="Create New Password"
      secureTextEntry
      value={password}
      onChangeText={setPassword}
      leftIconName="key"
      className="mb-4 border border-green-500 rounded-lg"
    />

    <Input
      placeholder="Confirm New Password"
      secureTextEntry
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      leftIconName="check"
      className="mb-6 border border-green-500 rounded-lg"
    />

    <Button
      title="Confirm"
      onPress={handleResetPassword}
      className="w-full py-3 rounded-lg mb-4"
      textStyle={{ color: "white", fontWeight: "bold" }}
      style={{ backgroundColor: "#34A853" }}
    />

    <View className="flex-row items-center my-9 w-full">
      <View className="flex-1 h-px bg-black mx-2 -mt-11" />
      <Text className="text-xs text-black -mt-11">Sign up instead</Text>
      <View className="flex-1 h-px bg-black mx-2 -mt-11" />
    </View>

    <Button
      title="Sign up"
      onPress={() => router.push("/signup")}
      className="w-full py-3 rounded-lg mb-6"
      textStyle={{ color: "white", fontWeight: "bold" }}
      style={{ backgroundColor: "#FF7A00" }}
    />

    <View className="flex-row justify-center mt-2">
      {/* <Button
        style={{ marginRight: 14 }}
        className="w-12 h-12 rounded-lg bg-white justify-center items-center shadow-md"
      >
        <Image
          source={require("../assets/images/google.png")}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      </Button> */}
      <GoogleSignUpButton/>
      <Button
        className="w-12 h-12 rounded-lg bg-white justify-center items-center shadow-md"
      >
        <Image
          source={require("../assets/images/facebook.png")}
          style={{ width: 24, height: 24 }}
          resizeMode="contain"
        />
      </Button>
    </View>
  </SafeAreaView>
);


}
}
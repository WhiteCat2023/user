import { forgotPassword } from "@/api/controller/auth.controller";
import { GoogleSignUpButton } from "@/components/ui/button/googleAuthButtons";
import Input from "@/components/ui/input/Input";
import { HttpStatus } from "@/enums/status";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSendEmail = async () => {
    if (!email) {
      Alert.alert("Please enter your email");
      return;
    }

    const req = await forgotPassword(email);
    if (req.status === HttpStatus.OK) {
      console.log("REQ SENT");
    }
  };

  return (
    <SafeAreaView className="flex-1 px-6 bg-white justify-center">
      {/* Logo */}
      <View className="items-center">
        <Image
          source={require("../assets/images/signup_logo.png")}
          style={{ width: 130, height: 130, resizeMode: "contain" }}
        />
      </View>

      {/* Instruction text */}
      <Text className="text-center text-black mb-5">
        Enter Email so we can send you confirmation
      </Text>

      {/* Input */}
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        leftIconName="mail"
        className="mb-6 border border-green-500 rounded-md bg-white"
      />

      {/* Send Email button */}
      <TouchableOpacity
        onPress={handleSendEmail}
        className="w-full py-4 rounded-lg mb-8 mt-3"
        style={{ backgroundColor: "#34C759" }}
      >
        <Text className="text-white font-bold text-center">Send Email</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-8">
        <View className="flex-1 h-px bg-black" />
        <Text className="text-xs text-black mx-2">Sign up Instead</Text>
        <View className="flex-1 h-px bg-black" />
      </View>

      {/* Sign up button */}
      <TouchableOpacity
        onPress={() => router.push("/signup")}
        className="w-full py-4 rounded-lg mb-8"
        style={{ backgroundColor: "#FF7A00" }}
      >
        <Text className="text-white font-bold text-center">Sign up</Text>
      </TouchableOpacity>

      {/* Social login buttons */}
      <View className="flex-row justify-center space-x-6">
        {/* Google */}
        <View
          className="w-12 h-12 mr-8 rounded-lg bg-white justify-center items-center"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <GoogleSignUpButton />
        </View>

        {/* Facebook */}
        <View
          className="w-12 h-12 rounded-lg bg-white justify-center items-center"
          style={{
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Image
            source={require("../assets/images/facebook.png")}
            style={{ width: 24, height: 24 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

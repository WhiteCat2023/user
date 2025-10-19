import { GoogleSignUpButton } from "@/components/ui/button/googleAuthButtons";
import { FacebookSignInButton } from "@/components/ui/button/facebookAuthButton";
import Input from "@/components/ui/input/Input";
import { useFonts } from "expo-font";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, ButtonText } from "@/components/ui/button";
import { Pressable } from "@/components/ui/pressable";
import { useAuth } from "../context/AuthContext";
import { ActivityIndicator } from "react-native";
// import { auth } from "@/api/config/firebase";

export const options = {
  headerShown: false,
};

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const [fontsLoaded] = useFonts({
    Pacifico: require("../assets/fonts/Pacifico-Regular.ttf"),
    Roboto: require("../assets/fonts/Roboto-Bold.ttf"),
  });

  if (!fontsLoaded) return null;

  const handleChange = (field, value) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login({ email: credentials.email, password: credentials.password });
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Login Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 justify-center">
      {/* Title */}
      <Text className="text-[22px] font-bold text-center mb-8">
        Welcome Back!
      </Text>

      {/* Logo as text */}
      <Text className="text-green-600 text-7xl text-center font-[Pacifico]">
        Ariba
      </Text>
      <Text className="text-black text-[15px] text-center mb-7 font-[Roboto]">
        Locate · Report · Connect
      </Text>

      {/* Social login */}
      <View className="flex-row justify-center mb-8 space-x-6">
        <Pressable style={[styles.socialButton, { marginRight: 20 }]}>
          <GoogleSignUpButton />
        </Pressable>

        <Pressable style={styles.socialButton}>
          <FacebookSignInButton />
        </Pressable>
      </View>

      {/* Email */}
      <Input
        placeholder="Email"
        value={credentials.email}
        onChangeText={(text) => handleChange("email", text)}
        leftIconName="user"
        className="w-full mb-4 border border-green-500 rounded-lg"
        editable={!loading}
      />

      {/* Password */}
      <Input
        placeholder="Password"
        value={credentials.password}
        onChangeText={(text) => handleChange("password", text)}
        secureTextEntry={!showPassword}
        leftIconName="key"
        icon={showPassword ? "eye-off" : "eye"}
        onIconPress={() => setShowPassword(!showPassword)}
        className="w-full mb-3 border border-green-500 rounded-lg"
        editable={!loading}
      />

      {/* Forgot password */}
      <Text
        className="text-right font-bold text-xs underline text-black -mt-3 mb-10"
        onPress={() => router.push("/forgot-password")}
      >
        Forget Password?
      </Text>

      {/* Login button - GREEN */}
      <Button
        size="lg"
        className="w-full h-12 mb-7 rounded-lg"
        style={{ backgroundColor: "#22c55e" }}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <ButtonText className="text-white font-bold">Login</ButtonText>
        )}
      </Button>

      {/* Divider */}
      <View className="flex-row items-center mb-9">
        <View className="flex-1 h-px bg-gray-300 mx-2" />
        <Text className="text-xs text-gray-600">Don’t have an account?</Text>
        <View className="flex-1 h-px bg-gray-300 mx-2" />
      </View>

      {/* Sign up button - ORANGE */}
      <Button
        size="lg"
        className="w-full h-12 rounded-lg"
        style={{ backgroundColor: "#f97316" }}
        onPress={() => router.push("/signup")}
      >
        <ButtonText className="text-white font-bold">Sign up</ButtonText>
      </Button>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    width: 50,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",

    // ✅ Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,

    // ✅ Shadow for Android
    elevation: 5,
  },
});

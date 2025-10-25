import { signUp } from "@/api/controller/auth.controller";
import { FacebookSignInButton } from "@/components/ui/button/facebookAuthButton";
import { GoogleSignUpButton } from "@/components/ui/button/googleAuthButtons";
import Input from "@/components/ui/input/Input";
import { Role } from "@/enums/roles";
import { useFonts } from "expo-font";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import { auth } from "../api/config/firebase";
import "../global.css";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: Role.USER,
    phone: "",
  });

  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Pacifico: require("../assets/fonts/Pacifico-Regular.ttf"),
    Roboto: require("../assets/fonts/Roboto-Bold.ttf"),
  });

  const [showErrors, setShowErrors] = useState(false);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (field, value) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Normalize Philippine phone numbers into E.164 (+63XXXXXXXXXX)
  const normalizePhilippinePhone = (input) => {
    if (!input) return null;
    // Remove spaces, dashes, parentheses
    const digits = input.replace(/[^0-9+]/g, "");

    // Strip leading + for checks
    const raw = digits.startsWith("+") ? digits.slice(1) : digits;

    // If already starts with country code 63 + 10 digits
    if (/^63\d{10}$/.test(raw)) return `+${raw}`;

    // If starts with 0 and mobile 09XXXXXXXXX or 9XXXXXXXXX
    if (/^0?9\d{9}$/.test(raw)) {
      const withoutLeading0 = raw.replace(/^0/, "");
      return `+63${withoutLeading0}`;
    }

    // If already +63XXXXXXXXXX
    if (/^\+63\d{10}$/.test(digits)) return digits;

    return null;
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    
    if (
      !credentials.firstName ||
      !credentials.lastName ||
      !credentials.email ||
      !credentials.phone ||
      credentials.password !== credentials.confirmPassword
    ) {
      Alert.alert("Please fix the errors before submitting.");
      return;
    }

    if (!isValidEmail(credentials.email)) {
      Alert.alert("Invalid email format");
      return;
    }

    // Normalize and validate Philippine phone number
    const normalizedPhone = normalizePhilippinePhone(credentials.phone);
    if (!normalizedPhone) {
      Alert.alert("Invalid phone", "Please enter a valid Philippine phone number (e.g. 09XXXXXXXXX or +639XXXXXXXXX).");
      return;
    }

    setLoading(true);
    // try to get location permission and current coords (latitude, longitude)
    let locationArray = null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        if (loc?.coords) {
          locationArray = [loc.coords.latitude, loc.coords.longitude];
        }
      } else {
        // Permission not granted - inform the user. Continue without location.
        Alert.alert(
          "Location permission required",
          "Location permission was not granted. You can enable it in device settings to attach your location to your account."
        );
      }
    } catch (locErr) {
      console.warn("Location error:", locErr);
      // Continue without location if fetching fails
    }

    try {
      // send credentials plus location (location may be null if not available)
  const payload = { ...credentials, location: locationArray, phone: normalizedPhone };
      const userCredential = await signUp(payload);

      if (userCredential?.data?.user) {
        try {
          await sendEmailVerification(userCredential?.data?.user);
          console.log(
            "✓ Verification email sent successfully to:",
            userCredential.user.email
          );
        } catch (emailError) {
          console.error("✗ Email verification failed:", emailError);
          console.log(
            "User created but email not sent. Error:",
            emailError.code,
            emailError.message
          );
        }

        setLoading(false);
        setCredentials({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: Role.USER,
          phone: "",
        });
        setShowErrors(false);

        Alert.alert(
          "Account Created",
          "Your account has been created. A verification email should arrive shortly at " +
            credentials.email +
            ". If you don't receive it, check your spam folder or request a new one after logging in.",
          [
            {
              text: "Back to Login",
              onPress: () => {
                router.replace("/index");
              },
            },
          ]
        );
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setLoading(false);
      Alert.alert("Error", error.message || "Failed to create account");
    }
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo */}
          <View className="items-center">
            <Image
              source={require("../assets/images/signup_logo.png")}
              style={{ width: 120, height: 120, resizeMode: "contain" }}
            />
          </View>

          {/* Greeting */}
          <Text className="text-[18px] text-green-600 font-bold text-center mb-8">
            Welcome Let’s Get you Started!
          </Text>

          {/* Input fields */}
          <View className="space-y-4">
            <Input
              placeholder="First Name"
              value={credentials.firstName}
              onChangeText={(t) => handleChange("firstName", t)}
              leftIconName="user"
              showErrors={showErrors}
              editable={!loading}
              style={{ borderColor: "green", borderWidth: 1, borderRadius: 8 }}
            />

            <Input
              placeholder="Last Name"
              value={credentials.lastName}
              onChangeText={(t) => handleChange("lastName", t)}
              leftIconName="user"
              showErrors={showErrors}
              editable={!loading}
              style={{ borderColor: "green", borderWidth: 1, borderRadius: 8 }}
            />

            <Input
              placeholder="Phone Number"
              value={credentials.phone}
              onChangeText={(t) => handleChange("phone", t)}
              leftIconName="phone"
              showErrors={showErrors}
              editable={!loading}
              keyboardType="phone-pad"
              style={{ borderColor: "green", borderWidth: 1, borderRadius: 8 }}
            />

            <Input
              placeholder="Email"
              value={credentials.email}
              onChangeText={(t) => handleChange("email", t)}
              leftIconName="mail"
              showErrors={showErrors}
              editable={!loading}
              style={{ borderColor: "green", borderWidth: 1, borderRadius: 8 }}
            />

            <Input
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={credentials.password}
              onChangeText={(t) => handleChange("password", t)}
              leftIconName="key"
              icon={showPassword ? "eye-off" : "eye"}
              onIconPress={() => setShowPassword(!showPassword)}
              type="password"
              showErrors={showErrors}
              editable={!loading}
              style={{ borderColor: "green", borderWidth: 1, borderRadius: 8 }}
            />

            <Input
              placeholder="Confirm Password"
              secureTextEntry={!showConfirmPassword}
              value={credentials.confirmPassword}
              onChangeText={(t) => handleChange("confirmPassword", t)}
              leftIconName="check"
              icon={showConfirmPassword ? "eye-off" : "eye"}
              onIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              type="confirmPassword"
              compareWith={credentials.password}
              showErrors={showErrors}
              editable={!loading}
              style={{ borderColor: "green", borderWidth: 1, borderRadius: 8 }}
            />
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className="w-full py-3 rounded-lg mb-6 mt-3"
            style={{
              backgroundColor: "#FF7A00",
              borderRadius: 8,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 2 },
              shadowRadius: 4,
              elevation: 3,
              opacity: loading ? 0.7 : 1,
            }}
            disabled={loading}
            activeOpacity={loading ? 1 : 0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <Text className="text-white font-bold text-center">Confirm</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-black" />
            <Text className="mx-2 text-xs text-black">or</Text>
            <View className="flex-1 h-px bg-black" />
          </View>

          {/* Social buttons */}
          <View className="flex-row justify-center space-x-6 mb-10">
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: 6,
                shadowColor: "#000",
                marginRight: 20,
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <GoogleSignUpButton />
            </View>

            <View
              style={{
                backgroundColor: "white",
                borderRadius: 8,
                padding: 6,
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <FacebookSignInButton />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

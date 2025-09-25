import { checkUserIfExist } from "@/api/controller/auth.controller";
import { newUserDoc, signInWithToken } from "@/api/services/firebase/auth.sevices";
import { Role } from "@/enums/roles";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider } from "firebase/auth";
import { useEffect } from "react";
import { Alert } from "react-native";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";

// Still need to fix redirectUri when using Expo Go

export function GoogleSignUpButton() {

  // const isWeb = Platform.OS === "web";s
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "171583954238-942e4itp9jo655aaf6rjf85p892jdfra.apps.googleusercontent.com",
    androidClientId: "171583954238-tis828c1rgbaos9e9uom9majjr9c4s8f.apps.googleusercontent.com",
    scopes: ["profile", "email", "openid"],
    responseType: "id_token",
    usePKCE: false,
    redirectUri: AuthSession.makeRedirectUri({ 
      useProxy: true 
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {

      const { id_token } = response.params;
      
      // console.log("Full response object:", JSON.stringify(response, null, 2));

      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithToken(credential)
          .then((userCredential) => {
            const user = userCredential.user;
            const isUserExist = checkUserIfExist(user.uid)
            
            if(!isUserExist) newUserDoc(userCredential, Role.USER);
            
            Alert.alert("Welcome!", `Signed in as ${user.displayName}`);
            // console.log("Signed up user:", user);
          })
          .catch((error) => {
            console.error("Firebase sign-in error:", error);
            Alert.alert("Sign in failed", error.message);
          });
      } else {
        console.error("ID Token not found in the response.");
        Alert.alert("Sign in failed", "Google authentication failed to return an ID token.");
      }
    }
  }, [response]);

  return (

    <Pressable
      disabled={!request}
      onPress={() => promptAsync()}
      className="w-12 h-12 rounded-lg bg-white justify-center items-center shadow-sm p-2">
      <Image 
        source={require("@/assets/images/google.png")} 
        style={{ width: 24, height: 24 }}
        resizeMode="contain" />
    </Pressable  >
  );
}

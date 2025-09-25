import { checkUserIfExist } from "@/api/controller/auth.controller";
import { newUserDoc, signInWithToken } from "@/api/services/firebase/auth.sevices";
import { Role } from "@/enums/roles";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { FacebookAuthProvider } from "firebase/auth";
import { useEffect } from "react";
import { Alert } from "react-native";
import { Image } from "@/components/ui/image";
import { Pressable } from "@/components/ui/pressable";

WebBrowser.maybeCompleteAuthSession();

export const FacebookSignInButton = () => {
    const [request, response, promptAsync] = Facebook.useAuthRequest({
        clientId: "2262681760826839"
    });

    useEffect(() => {
        if(response?.type == "success"){

            // console.log("Full response object:", JSON.stringify(response, null, 2));
            const { access_token } = response.params;
            if(access_token){
                const credential = FacebookAuthProvider.credential(access_token)
                signInWithToken(credential)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        newUserDoc(userCredential, Role.USER);
                        Alert.alert("Welcome!", `Signed in as ${user.displayName}`);
                        // console.log("Signed up user:", user);
                })
                .catch((error) => {
                    console.error("Firebase sign-in error:", error);
                    Alert.alert("Sign in failed", error.message);
                });
            } else {
                console.error("Access Token not found in the response.");
                Alert.alert("Sign in failed", "Facebook authentication failed to return an Access token.");
            }
        }
    })

    return(
        <Pressable
            disabled={!request}
            onPress={() => promptAsync()}
            className="w-12 h-12 rounded-lg bg-white justify-center items-center shadow-md p-1">
            <Image
                source={require("@/assets/images/facebook.png")}
                style={{ width: 24, height: 24 }}
                resizeMode="contain"
            />
        </Pressable>
    )
}
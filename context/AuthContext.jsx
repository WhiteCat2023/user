import { auth } from "@/api/config/firebase.config";
import { signIn, signOut } from "@/api/controller/auth.controller";
import { getUserInfoFromFirestore } from "@/api/controller/users.controller";
import { getUserDoc } from "@/api/services/firebase/users.services";
import { Role } from "@/enums/roles";
import { HttpStatus } from "@/enums/status";
import { usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(false);
  const [user, setUser] = useState({});
  const [userDoc, setUserDoc] = useState({});
  const [role, setRole] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  const pathCollection = ["/", "/signup", "/forgot-password"];

  const isWeb = Platform.OS === "web";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setSession(!!currentUser);

      if (currentUser) {
        getUserDoc(currentUser.uid, setUserDoc);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setRole(userDoc?.role);
  }, [userDoc]);

  useEffect(() => {
    const currentPath = pathname;

    // Only redirect if not already on the correct page
    if (
      session &&
      role === Role.ADMIN &&
      !currentPath.startsWith("/admin") &&
      isWeb
    ) {
      router.replace("/admin/(tabs)");
      return;
    }
    if (session && role === Role.USER && !currentPath.startsWith("/(tabs)")) {
      router.replace("/(tabs)");
      return;
    }
    if (!session && !pathCollection.includes(currentPath)) {
      router.replace("/");
      return;
    }
  }, [session, pathname, role]);

  const login = async (req) => {
    const res = await signIn(req);
    console.log(userDoc);
    if (res.status === HttpStatus.OK) {
      console.log("Login successful");
      console.log(res.data.displayName);
      console.log(res.data.uid);
    } else {
      Alert.alert("Login Failed", res.message);
    }
  };

  const register = async (req) => {
    const res = await signUp(req);

    if (res.status === HttpStatus.OK) {
      const { email, password } = req;
      await login({ email, password });
    } else {
      Alert.alert("Signup Failed", res.message);
    }
  };

  const logout = async () => {
    const res = await signOut({ uid: user?.uid });
    if (res.status === HttpStatus.OK) {
      setUser(null);
      setSession(false);
    } else {
      Alert.alert("Logout Failed", res.message);
    }
  };

  const contextData = { session, user, login, logout, register, userDoc, role };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

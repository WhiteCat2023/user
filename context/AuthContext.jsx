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
  SafeAreaView,
  Text,
} from "react-native";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setRole(userDoc?.role);
  }, [userDoc]);

  useEffect(() => {
    if (loading) return;

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
    if (session && role === Role.USER && !currentPath.startsWith("/user")) {
      router.replace("/user/(tabs)");
      return;
    }
    if (!session && !pathCollection.includes(currentPath)) {
      router.replace("/");
      return;
    }
  }, [session, loading, pathname, role]);

  const login = async (req) => {
    setLoading(true);
    const res = await signIn(req);
    console.log(userDoc);
    if (res.status === HttpStatus.OK) {
      console.log("Login successful");
      console.log(user.data.displayName);
      console.log(user.data.uid);
    } else {
      Alert.alert("Login Failed", res.message);
    }
    setLoading(false);
  };

  const register = async (req) => {
    setLoading(true);
    const res = await signUp(req);

    if (res.status === HttpStatus.OK) {
      await login({ email, password });
    } else {
      Alert.alert("Signup Failed", res.message);
    }
    setLoading(false);
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
      {loading ? (
        <SafeAreaView
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </SafeAreaView>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

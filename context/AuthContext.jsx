import { auth } from "@/api/config/firebase.config";
import { signIn, signOut, signUp } from "@/api/controller/auth.controller";
import { getUserDoc } from "@/api/services/firebase/users.services";
import { Role } from "@/enums/roles";
import { HttpStatus } from "@/enums/status";
import { usePathname, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(false);
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState({});
  const [role, setRole] = useState(null);

  const router = useRouter();
  const pathname = usePathname();

  const authPaths = ["/", "/signup", "/forgot-password", "/reset-password"];
  const hasRedirected = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setSession(!!currentUser);

      if (currentUser) {
        getUserDoc(currentUser.uid, setUserDoc);
      } else {
        setUserDoc({});
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setRole(userDoc?.role);
  }, [userDoc]);

  useEffect(() => {
    const currentPath = pathname;

    if (session) {
      if (!hasRedirected.current && authPaths.includes(currentPath)) {
        router.replace("/(tabs)/home");
        hasRedirected.current = true;
      }
    } else {
      hasRedirected.current = false;
      if (!authPaths.includes(currentPath)) {
        router.replace("/");
      }
    }
  }, [session, pathname]);

  const login = async (req) => {
    const res = await signIn(req);
    if (res.status === HttpStatus.OK) {
      // Login successful
      router.replace("/(tabs)/home");
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
      setUserDoc({});
      setRole(null);
      router.replace("/");
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

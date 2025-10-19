import { auth } from "@/api/config/firebase.config";
import { signIn, signOut, signUp } from "@/api/controller/auth.controller";
import { getUserDoc } from "@/api/services/firebase/users.services";
import { Role } from "@/enums/roles";
import { HttpStatus } from "@/enums/status";
import { usePathname, useRouter } from "expo-router";
import { onAuthStateChanged, sendEmailVerification } from "firebase/auth";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(false);
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState({});
  const [role, setRole] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const authPaths = ["/", "/signup", "/forgot-password", "/reset-password"];
  const hasRedirected = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        currentUser.reload().then(() => {
          setUser(currentUser);
          setIsVerified(currentUser.emailVerified);
          // Only set session if email is verified
          if (currentUser.emailVerified) {
            setSession(true);
            getUserDoc(currentUser.uid, setUserDoc);
          } else {
            setSession(false);
          }
        });
      } else {
        setUser(null);
        setSession(false);
        setIsVerified(false);
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
      const user = auth.currentUser;
      if (user) {
        await user.reload();

        if (!user.emailVerified) {
          Alert.alert(
            "Email Not Verified",
            "Please verify your email before logging in. Check your inbox for the verification link.",
            [
              {
                text: "Resend Email",
                onPress: async () => {
                  try {
                    await sendEmailVerification(user);
                    Alert.alert("Success", "Verification email sent. Please check your inbox.");
                  } catch (error) {
                    Alert.alert("Error", "Failed to resend verification email.");
                  }
                },
              },
              { text: "OK" },
            ]
          );
          return;
        }

        // Email is verified, set session and redirect
        setUser(user);
        setSession(true);
        setIsVerified(true);
        getUserDoc(user.uid, setUserDoc);
        router.replace("/(tabs)/home");
      }
    } else {
      Alert.alert("Login Failed", res.message);
    }
  };

  const register = async (req) => {
    const res = await signUp(req);

    if (res.status === HttpStatus.OK) {
      // Don't automatically login after signup
      // User must verify email and login manually
      return res;
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

import { Tabs } from "expo-router";
import ProtectedRoute from "../../utils/ProtectedRoute/ProtectedRoute";

export default function TabLayout() {
  return (
    <ProtectedRoute>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="reports" options={{ title: "Reports" }} />
        <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </ProtectedRoute>
  );
}

import { Stack } from "expo-router";

export default function NotificationsLayout() {
 return (
    <Stack>
      <Stack.Screen name="notifications" options={{ title: "Notifications", headerShown: false }} />
      <Stack.Screen name="notificationID/[id]" options={{ title: "Notification Details", headerShown: false }} />
    </Stack>
  );
}
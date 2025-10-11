import { Stack } from "expo-router";

export default function NotificationsLayout() {
 return (
    <Stack>
        <Stack.Screen name="[id]" options={{ title: "Notification Details", headerShown: false }} />
        <Stack.Screen name="notifications" options={{ title: "Notifications", headerShown: false }} />
    </Stack>
  );
}
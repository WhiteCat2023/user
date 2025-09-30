import { Stack } from "expo-router";

export default function ReportsLayout() {
 return (
    <Stack>
        <Stack.Screen name="reports" options={{ title: "Reports", headerShown: false }} />
        <Stack.Screen name="[id]" options={{ title: "Report Details", headerShown: false }} />
        <Stack.Screen name="edit/[id]" options={{ title: "Edit Report", headerShown: false }} />
    </Stack>
  );
}
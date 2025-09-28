import { Stack } from "expo-router";

export default function ForumLayout() {
  return (
    <Stack>
        <Stack.Screen name="index" options={{ title: "Forum", headerShown: false }} />
        <Stack.Screen name="[id]" options={{ title: "Forum", headerShown: false }} />
    </Stack>
  );
}
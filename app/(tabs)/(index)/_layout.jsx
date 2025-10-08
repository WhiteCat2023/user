import { Stack } from "expo-router";

export default function ForumLayout() {
  return (
    <Stack>
        <Stack.Screen name="home" options={{ title: "Forum", headerShown: false }} />
        <Stack.Screen name="[id]" options={{ title: "Forum", headerShown: false }} />
    </Stack>
  );
}
import { Stack } from "expo-router";

export default function AILayout() {
  return (
    <Stack>
        <Stack.Screen name="ai" options={{ title: "AI", headerShown: false }} />
    </Stack>
  );
}
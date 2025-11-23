import { Stack } from "expo-router";

export default function AdminProfileLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="scan-order" options={{ headerShown: false }} />
            <Stack.Screen name="process-order/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="fulfill-order" options={{ headerShown: false }} />
        </Stack>
    )
}


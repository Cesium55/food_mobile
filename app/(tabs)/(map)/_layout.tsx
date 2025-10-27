import { Stack } from "expo-router";

export default function MapLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="seller/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="shop/[id]" options={{ headerShown: false }} />
        </Stack>
    )
}


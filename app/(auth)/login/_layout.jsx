import { Stack } from 'expo-router';

export default function LoginLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="email" />
      <Stack.Screen name="reset_password" />
      <Stack.Screen name="new_password" />
    </Stack>
  );
}

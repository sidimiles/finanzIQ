import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0F14' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#0B0F14' },
      }}
    >
      <Stack.Screen name="add-account" options={{ title: 'Neues Konto' }} />
      <Stack.Screen name="add-transaction" options={{ title: 'Neue Buchung' }} />
      <Stack.Screen name="add-budget" options={{ title: 'Neues Budget' }} />
      <Stack.Screen name="add-recurring" options={{ title: 'Wiederkehrende Zahlung' }} />
    </Stack>
  );
}

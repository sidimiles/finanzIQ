import { Stack } from 'expo-router';
import { useTheme } from '../../lib/theme';

export default function ModalsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="add-account" options={{ title: 'Neues Konto' }} />
      <Stack.Screen name="add-transaction" options={{ title: 'Neue Buchung' }} />
      <Stack.Screen name="add-budget" options={{ title: 'Neues Budget' }} />
      <Stack.Screen name="add-recurring" options={{ title: 'Wiederkehrende Zahlung' }} />
      <Stack.Screen name="add-transfer" options={{ title: 'Kontoübertrag' }} />
      <Stack.Screen name="add-goal" options={{ title: 'Neues Sparziel' }} />
      <Stack.Screen name="categories" options={{ title: 'Kategorien verwalten' }} />
      <Stack.Screen name="transactions" options={{ title: 'Alle Buchungen' }} />
    </Stack>
  );
}

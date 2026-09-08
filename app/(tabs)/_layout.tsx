import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4F8CFF',
        tabBarStyle: { backgroundColor: '#0B0F14', borderTopColor: '#232B36' },
      }}
    >
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Konten',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Berichte',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recurring"
        options={{
          title: 'Wiederkehrend',
          tabBarIcon: ({ color, size }) => <Ionicons name="repeat-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

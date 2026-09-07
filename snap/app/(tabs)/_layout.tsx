import { Tabs } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'

import { useAuth } from '@/lib/auth-context'

function LogoutButton() {
  const { logout } = useAuth()

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Logga ut"
      hitSlop={8}
      onPress={() => void logout()}
      style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}>
      <Text style={styles.logoutText}>Logga ut</Text>
    </Pressable>
  )
}

export default function TabsLayout() {
  return (
    <Tabs initialRouteName="index" screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Chats',
          headerShown: true,
          headerRight: () => <LogoutButton />,
        }}
      />
      <Tabs.Screen name="index" options={{ title: 'Camera' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoutText: {
    color: '#0a84ff',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.6,
  },
})

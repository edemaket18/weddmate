import { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { useAuthStore } from '../store/auth.store'
import { View, ActivityIndicator } from 'react-native'

const COLORS = { primary: '#1B3A5C', accent: '#C9A84C' }

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadSession } = useAuthStore()

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.replace('/(app)/dashboard')
    } else {
      router.replace('/(auth)/login')
    }
  }, [isLoading, isAuthenticated])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
      <Stack.Screen name="rsvp/[slug]" options={{ headerShown: false }} />
    </Stack>
  )
}

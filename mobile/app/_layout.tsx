import { useEffect, useState } from 'react'
import { Stack, router, useSegments } from 'expo-router'
import { useAuthStore } from '../store/auth.store'
import { View, ActivityIndicator } from 'react-native'

const COLORS = { primary: '#1B3A5C', accent: '#C9A84C' }

export default function RootLayout() {
  const { isLoading, isAuthenticated, loadSession } = useAuthStore()
  const segments = useSegments()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    loadSession()
  }, [])

  useEffect(() => {
    if (!mounted || isLoading) return
    const isPublicRsvp = segments[0] === 'rsvp'
    if (isPublicRsvp) return

    const inAuthGroup = segments[0] === '(auth)'
    const inAppGroup = segments[0] === '(app)'

    if (isAuthenticated && !inAppGroup) {
      router.replace('/(app)/dashboard')
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login')
    }
  }, [mounted, isLoading, isAuthenticated, segments])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }} onLayout={() => setMounted(true)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="rsvp/[slug]" options={{ headerShown: false }} />
      </Stack>
    </View>
  )
}

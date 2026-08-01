import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../store/auth.store'

const COLORS = { primary: '#1B3A5C', accent: '#C9A84C' }

export default function Index() {
  const { isLoading, isAuthenticated } = useAuthStore()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    )
  }

  return isAuthenticated
    ? <Redirect href="/(app)/dashboard" />
    : <Redirect href="/(auth)/login" />
}
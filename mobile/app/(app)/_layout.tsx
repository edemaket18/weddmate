 import { Tabs, router } from 'expo-router'
import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useAuthStore } from '../../store/auth.store'
import { useWeddingStore } from '../../store/wedding.store'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  muted: '#6B7C93', border: '#D0D9E4',
}

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore()
  const { fetchWeddings } = useWeddingStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login')
      return
    }
    fetchWeddings()
  }, [isAuthenticated])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Accueil" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="prestataires"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤝" label="Presta" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" label="Budget" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="invites"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Invités" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="galerie"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📸" label="Galerie" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="taches"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Tâches" focused={focused} />,
        }}
      />
      <Tabs.Screen 
        name="create-wedding" 
        options={{href:null}} 
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 56,
  },
  tabIconActive: { backgroundColor: 'rgba(27,58,92,0.08)' },
  tabEmoji: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '400' },
  tabLabelActive: { color: COLORS.primary, fontWeight: '600' },
})
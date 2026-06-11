import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../lib/api'

interface User {
  id: string
  email: string
  nom: string
  prenom: string
  telephone: string | null
  role: string
  avatarUrl: string | null
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, motDePasse: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
}

interface RegisterData {
  email: string
  motDePasse: string
  nom: string
  prenom: string
  telephone?: string
  role?: string
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, motDePasse) => {
    const { data } = await api.post('/api/auth/login', { email, motDePasse })
    const { user, token } = data.data
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  register: async (registerData) => {
    const { data } = await api.post('/api/auth/register', registerData)
    const { user, token } = data.data
    await AsyncStorage.setItem('token', token)
    await AsyncStorage.setItem('user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    try { await api.post('/api/auth/logout') } catch {}
    await AsyncStorage.multiRemove(['token', 'user'])
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) { set({ isLoading: false }); return }
      const { data } = await api.get('/api/auth/me')
      set({ user: data.data, token, isAuthenticated: true, isLoading: false })
    } catch {
      await AsyncStorage.multiRemove(['token', 'user'])
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
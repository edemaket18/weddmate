import axios  from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const resolveApiBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_API_URL
  if (url) return url.replace(/\/$/, '')
  if (__DEV__) return 'http://localhost:3001'
  throw new Error('EXPO_PUBLIC_API_URL est requis pour un build de production')
}

export const API_BASE_URL = resolveApiBaseUrl()

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Injecte le token automatiquement sur chaque requête
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Gère les erreurs globalement
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('token')
    }
    return Promise.reject(err)
  }
)

 import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { StatusBar } from 'expo-status-bar'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', error: '#E53E3E',
}

export default function LoginScreen() {
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; motDePasse?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email invalide'
    if (!motDePasse) newErrors.motDePasse = 'Mot de passe requis'
    else if (motDePasse.length < 8) newErrors.motDePasse = 'Min 8 caractères'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.toLowerCase().trim(), motDePasse)
      // FIX CRITIQUE : plus de router.replace() ici.
      // Le root layout détecte isAuthenticated=true et redirige
      // automatiquement. Avoir les deux créait une double navigation
      // qui s'annulait, bloquant l'app sur Dashboard sans pouvoir naviguer.
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur de connexion. Vérifiez vos identifiants.'
      Alert.alert('Connexion échouée', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logo}><Text style={styles.logoText}>💍</Text></View>
          <Text style={styles.appName}>WeddMate</Text>
          <Text style={styles.tagline}>Votre mariage, sans stress</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>Bienvenue ! Connectez-vous pour continuer.</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="koffi@exemple.com"
              placeholderTextColor={COLORS.muted}
              value={email}
              onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })) }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.motDePasse ? styles.inputError : null]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.muted}
                value={motDePasse}
                onChangeText={(t) => { setMotDePasse(t); setErrors(e => ({ ...e, motDePasse: undefined })) }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.motDePasse && <Text style={styles.errorText}>{errors.motDePasse}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnPrimaryText}>Se connecter</Text>}
          </TouchableOpacity>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
            <Text style={styles.btnOutlineText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>En vous connectant, vous acceptez nos conditions d'utilisation.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(201,168,76,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: COLORS.accent },
  logoText: { fontSize: 32 },
  appName: { fontSize: 28, fontWeight: '700', color: COLORS.white, letterSpacing: 1, marginBottom: 4 },
  tagline: { fontSize: 14, color: COLORS.accent, opacity: 0.9 },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8, marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray },
  inputError: { borderColor: COLORS.error },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 12, top: 12, padding: 2 },
  eyeText: { fontSize: 18 },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4, marginLeft: 4 },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: COLORS.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  separatorLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  separatorText: { fontSize: 13, color: COLORS.muted },
  btnOutline: { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnOutlineText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  footer: { textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.5)', paddingHorizontal: 16 },
})
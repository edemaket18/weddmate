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

export default function RegisterScreen() {
  const { register } = useAuthStore()
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', telephone: '', motDePasse: '', confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nom.trim()) e.nom = 'Nom requis'
    if (!form.prenom.trim()) e.prenom = 'Prénom requis'
    if (!form.email.trim()) e.email = 'Email requis'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide'
    if (!form.motDePasse) e.motDePasse = 'Mot de passe requis'
    else if (form.motDePasse.length < 8) e.motDePasse = 'Min 8 caractères'
    if (form.motDePasse !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.toLowerCase().trim(),
        motDePasse: form.motDePasse,
        telephone: form.telephone.trim() || undefined,
        role: 'COUPLE',
      })
      router.replace('/(app)/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors de la création du compte.'
      Alert.alert('Inscription échouée', msg)
    } finally {
      setLoading(false)
    }
  }

  const Field = ({
    label, field, placeholder, keyboard = 'default', secure = false,
  }: { label: string; field: string; placeholder: string; keyboard?: any; secure?: boolean }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[field] ? styles.inputError : null]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        value={form[field as keyof typeof form]}
        onChangeText={(v) => update(field, v)}
        keyboardType={keyboard}
        secureTextEntry={secure && !showPassword}
        autoCapitalize={keyboard === 'email-address' || secure ? 'none' : 'words'}
        autoCorrect={false}
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  )

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.appName}>💍 WeddMate</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Créer un compte</Text>
          <Text style={styles.subtitle}>Commencez à préparer votre mariage dès aujourd'hui.</Text>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Prénom" field="prenom" placeholder="Ama" />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Field label="Nom" field="nom" placeholder="Koffi" />
            </View>
          </View>

          <Field label="Email" field="email" placeholder="koffi@exemple.com" keyboard="email-address" />
          <Field label="Téléphone / WhatsApp" field="telephone" placeholder="+228 90 00 00 00" keyboard="phone-pad" />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput, errors.motDePasse ? styles.inputError : null]}
                placeholder="Min 8 caractères"
                placeholderTextColor={COLORS.muted}
                value={form.motDePasse}
                onChangeText={(v) => update('motDePasse', v)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.motDePasse ? <Text style={styles.errorText}>{errors.motDePasse}</Text> : null}
          </View>

          <Field label="Confirmer le mot de passe" field="confirm" placeholder="••••••••" secure />
          {errors.confirm ? <Text style={[styles.errorText, { marginTop: -10, marginBottom: 8 }]}>{errors.confirm}</Text> : null}

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.btnPrimaryText}>Créer mon compte</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
            <Text style={styles.loginLinkText}>Déjà un compte ? <Text style={styles.loginLinkBold}>Se connecter</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { padding: 8 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  appName: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  card: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.muted, marginBottom: 20 },
  row: { flexDirection: 'row' },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray },
  inputError: { borderColor: COLORS.error },
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 12, top: 12, padding: 2 },
  eyeText: { fontSize: 18 },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4, marginLeft: 4 },
  btnPrimary: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 8, elevation: 4 },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  loginLink: { alignItems: 'center', marginTop: 16 },
  loginLinkText: { fontSize: 14, color: COLORS.muted },
  loginLinkBold: { color: COLORS.primary, fontWeight: '700' },
})

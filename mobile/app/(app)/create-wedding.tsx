import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native'
import { useState } from 'react'
import { router } from 'expo-router'
import { useWeddingStore } from '../../store/wedding.store'
import { StatusBar } from 'expo-status-bar'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', error: '#E53E3E',
}

export default function CreateWeddingScreen() {
  const { createWedding } = useWeddingStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nomCeremonie: '',
    dateJourJ: '',
    heureCeremonie: '',
    heureReception: '',
    lieuCeremonie: '',
    lieuReception: '',
    budgetTotal: '',
    devise: 'FCFA',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nomCeremonie.trim()) e.nomCeremonie = 'Nom de la cérémonie requis'
    if (!form.dateJourJ.trim()) e.dateJourJ = 'Date requise'
    else {
      const parts = form.dateJourJ.split('/')
      if (parts.length !== 3) e.dateJourJ = 'Format: JJ/MM/AAAA'
      else {
        const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
        if (isNaN(d.getTime())) e.dateJourJ = 'Date invalide'
        else if (d < new Date()) e.dateJourJ = 'La date doit être dans le futur'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const parseDate = (str: string) => {
    const parts = str.split('/')
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T10:00:00.000Z`).toISOString()
  }

  const handleCreate = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await createWedding({
        nomCeremonie: form.nomCeremonie.trim(),
        dateJourJ: parseDate(form.dateJourJ),
        heureCeremonie: form.heureCeremonie.trim() || undefined,
        heureReception: form.heureReception.trim() || undefined,
        lieuCeremonie: form.lieuCeremonie.trim() || undefined,
        lieuReception: form.lieuReception.trim() || undefined,
        budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : undefined,
        devise: form.devise,
      } as any)
      Alert.alert('🎉 Mariage créé !', 'Votre mariage a été créé avec succès.', [
        { text: 'Voir le dashboard', onPress: () => router.replace('/(app)/dashboard') }
      ])
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erreur lors de la création.'
      Alert.alert('Erreur', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer mon mariage</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💍 Informations générales</Text>

          {/* FIX: value={form.nomCeremonie} sans ?? — pas besoin */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom de la cérémonie *</Text>
            <TextInput
              style={[styles.input, errors.nomCeremonie && styles.inputError]}
              placeholder="Ex: Mariage Koffi & Ama"
              placeholderTextColor={COLORS.muted}
              value={form.nomCeremonie}
              onChangeText={v => update('nomCeremonie', v)}
              autoCapitalize="words"
              autoCorrect={false}
            />
            {errors.nomCeremonie ? <Text style={styles.errorText}>{errors.nomCeremonie}</Text> : null}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date du mariage * (JJ/MM/AAAA)</Text>
            <TextInput
              style={[styles.input, errors.dateJourJ && styles.inputError]}
              placeholder="20/12/2026"
              placeholderTextColor={COLORS.muted}
              value={form.dateJourJ}
              onChangeText={v => update('dateJourJ', v)}
              keyboardType="default"
              autoCorrect={false}
            />
            {errors.dateJourJ ? <Text style={styles.errorText}>{errors.dateJourJ}</Text> : null}
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Heure cérémonie</Text>
              <TextInput
                style={styles.input}
                placeholder="10h00"
                placeholderTextColor={COLORS.muted}
                value={form.heureCeremonie}
                onChangeText={v => update('heureCeremonie', v)}
                autoCorrect={false}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Heure réception</Text>
              <TextInput
                style={styles.input}
                placeholder="13h00"
                placeholderTextColor={COLORS.muted}
                value={form.heureReception}
                onChangeText={v => update('heureReception', v)}
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Lieux</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Lieu de la cérémonie</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Église Saint-Paul, Lomé"
              placeholderTextColor={COLORS.muted}
              value={form.lieuCeremonie}
              onChangeText={v => update('lieuCeremonie', v)}
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Lieu de la réception</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Hôtel Sarakawa, Lomé"
              placeholderTextColor={COLORS.muted}
              value={form.lieuReception}
              onChangeText={v => update('lieuReception', v)}
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Budget</Text>

          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Budget total prévu</Text>
              <TextInput
                style={styles.input}
                placeholder="2000000"
                placeholderTextColor={COLORS.muted}
                value={form.budgetTotal}
                onChangeText={v => update('budgetTotal', v)}
                keyboardType="numeric"
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Devise</Text>
              <TextInput
                style={styles.input}
                placeholder="FCFA"
                placeholderTextColor={COLORS.muted}
                value={form.devise}
                onChangeText={v => update('devise', v)}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>💍 Créer mon mariage</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  scroll: { padding: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  field: { marginBottom: 14 },
  row: { flexDirection: 'row', marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
})
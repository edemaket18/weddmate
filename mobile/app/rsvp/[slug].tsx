import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import axios from 'axios'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', success: '#38A169', danger: '#E53E3E', error: '#E53E3E',
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001'

interface WeddingInfo {
  nomCeremonie: string
  dateJourJ: string
  heureCeremonie: string | null
  heureReception: string | null
  lieuCeremonie: string | null
  lieuReception: string | null
}

type Step = 'form' | 'confirmation'

export default function RsvpPublicScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [wedding, setWedding] = useState<WeddingInfo | null>(null)
  const [loadingWedding, setLoadingWedding] = useState(true)
  const [step, setStep] = useState<Step>('form')
  const [submitting, setSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<any>(null)
  const [form, setForm] = useState({
    nom: '', prenom: '', whatsapp: '',
    statut: 'CONFIRME', nombreAccompa: '0',
    regimeAliment: '', transport: false,
    hebergement: false, messageAuxMaries: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchWedding = async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/rsvp/${slug}`)
        setWedding(data.data)
      } catch (e: any) {
        const msg = e?.response?.data?.error || 'Formulaire introuvable ou fermé.'
        Alert.alert('Indisponible', msg)
      }
      setLoadingWedding(false)
    }
    if (slug) fetchWedding()
  }, [slug])

  const update = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.prenom.trim()) e.prenom = 'Prénom requis'
    if (!form.nom.trim()) e.nom = 'Nom requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const { data } = await axios.post(`${BASE_URL}/rsvp/${slug}`, {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        statut: form.statut,
        whatsapp: form.whatsapp.trim() || undefined,
        nombreAccompa: parseInt(form.nombreAccompa) || 0,
        regimeAliment: form.regimeAliment.trim() || undefined,
        transport: form.transport,
        hebergement: form.hebergement,
        messageAuxMaries: form.messageAuxMaries.trim() || undefined,
      })
      setSubmittedData(data.data)
      setStep('confirmation')
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de la soumission.')
    }
    setSubmitting(false)
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

  if (loadingWedding) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  )

  if (!wedding) return (
    <View style={styles.center}>
      <Text style={styles.errorEmoji}>💔</Text>
      <Text style={styles.errorTitle}>Formulaire indisponible</Text>
      <Text style={styles.errorText}>Ce formulaire RSVP est fermé ou introuvable.</Text>
    </View>
  )

  //PAGE DE CONFIRMATION
  if (step === 'confirmation' && submittedData) {
    const isConfirmed = form.statut === 'CONFIRME'
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.confirmScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.confirmHeader}>
            <Text style={styles.confirmEmoji}>{isConfirmed ? '🎉' : '😢'}</Text>
            <Text style={styles.confirmTitle}>
              {isConfirmed ? 'Présence confirmée !' : 'Réponse enregistrée'}
            </Text>
            <Text style={styles.confirmName}>
              {form.prenom} {form.nom}
            </Text>
          </View>

          <View style={styles.confirmCard}>
            <Text style={styles.confirmCardTitle}>💍 {wedding.nomCeremonie}</Text>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>📅 Date</Text>
              <Text style={styles.confirmValue}>{formatDate(wedding.dateJourJ)}</Text>
            </View>
            {wedding.heureCeremonie && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>⏰ Cérémonie</Text>
                <Text style={styles.confirmValue}>{wedding.heureCeremonie}</Text>
              </View>
            )}
            {wedding.heureReception && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>🥂 Réception</Text>
                <Text style={styles.confirmValue}>{wedding.heureReception}</Text>
              </View>
            )}
            {wedding.lieuCeremonie && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>📍 Cérémonie</Text>
                <Text style={styles.confirmValue}>{wedding.lieuCeremonie}</Text>
              </View>
            )}
            {wedding.lieuReception && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>🏛️ Réception</Text>
                <Text style={styles.confirmValue}>{wedding.lieuReception}</Text>
              </View>
            )}
          </View>

          {isConfirmed && form.whatsapp && (
            <View style={styles.reminderNote}>
              <Text style={styles.reminderText}>
                📱 Un rappel WhatsApp vous sera envoyé 7 jours avant le mariage.
              </Text>
            </View>
          )}

          <Text style={styles.thankYou}>
            {isConfirmed
              ? 'Merci ! Nous avons hâte de vous voir le jour J. 💍'
              : 'Merci pour votre réponse. Vous serez regretté(e) !'}
          </Text>
        </ScrollView>
      </View>
    )
  }

  //FORMULAIRE RSVP
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
          <Text style={styles.headerEmoji}>💍</Text>
          <Text style={styles.headerTitle}>{wedding.nomCeremonie}</Text>
          <Text style={styles.headerDate}>{formatDate(wedding.dateJourJ)}</Text>
          {wedding.lieuCeremonie && (
            <Text style={styles.headerLieu}>📍 {wedding.lieuCeremonie}</Text>
          )}
        </View>

        {/* Formulaire */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirmez votre présence</Text>

          {/* Statut */}
          <Text style={styles.fieldLabel}>Votre réponse *</Text>
          <View style={styles.statutRow}>
            {[
              { key: 'CONFIRME', label: '✅ Je serai présent(e)', color: COLORS.success },
              { key: 'DECLINE', label: '❌ Je ne pourrai pas venir', color: COLORS.danger },
            ].map(s => (
              <TouchableOpacity
                key={s.key}
                style={[
                  styles.statutChip,
                  form.statut === s.key && { backgroundColor: s.color, borderColor: s.color },
                ]}
                onPress={() => update('statut', s.key)}
              >
                <Text style={[styles.statutChipText, form.statut === s.key && { color: COLORS.white }]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nom / Prénom */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Prénom *</Text>
              <TextInput
                style={[styles.input, errors.prenom && styles.inputError]}
                placeholder="Kokou"
                placeholderTextColor={COLORS.muted}
                value={form.prenom}
                onChangeText={v => update('prenom', v)}
              />
              {errors.prenom ? <Text style={styles.errorText}>{errors.prenom}</Text> : null}
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Nom *</Text>
              <TextInput
                style={[styles.input, errors.nom && styles.inputError]}
                placeholder="Mensah"
                placeholderTextColor={COLORS.muted}
                value={form.nom}
                onChangeText={v => update('nom', v)}
              />
              {errors.nom ? <Text style={styles.errorText}>{errors.nom}</Text> : null}
            </View>
          </View>

          {/* WhatsApp */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>WhatsApp (pour rappel J-7)</Text>
            <TextInput
              style={styles.input}
              placeholder="+228 90 00 00 00"
              placeholderTextColor={COLORS.muted}
              value={form.whatsapp}
              onChangeText={v => update('whatsapp', v)}
              keyboardType="phone-pad"
            />
          </View>

          {form.statut === 'CONFIRME' && (
            <>
              {/* Accompagnants */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Nombre d'accompagnants</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.muted}
                  value={form.nombreAccompa}
                  onChangeText={v => update('nombreAccompa', v)}
                  keyboardType="numeric"
                />
              </View>

              {/* Régime alimentaire */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Régime alimentaire</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Végétarien, Halal..."
                  placeholderTextColor={COLORS.muted}
                  value={form.regimeAliment}
                  onChangeText={v => update('regimeAliment', v)}
                />
              </View>

              {/* Transport / Hébergement */}
              <View style={styles.togglesRow}>
                <TouchableOpacity
                  style={[styles.toggleChip, form.transport && styles.toggleChipActive]}
                  onPress={() => update('transport', !form.transport)}
                >
                  <Text style={[styles.toggleChipText, form.transport && { color: COLORS.white }]}>
                    🚗 Besoin transport
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleChip, form.hebergement && styles.toggleChipActive]}
                  onPress={() => update('hebergement', !form.hebergement)}
                >
                  <Text style={[styles.toggleChipText, form.hebergement && { color: COLORS.white }]}>
                    🏨 Hébergement
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Message aux mariés */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Message aux mariés 💌</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Vos vœux, un mot doux..."
              placeholderTextColor={COLORS.muted}
              value={form.messageAuxMaries}
              onChangeText={v => update('messageAuxMaries', v)}
              multiline
              maxLength={500}
            />
          </View>

          {/* Bouton soumettre */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled,
              form.statut === 'DECLINE' && styles.submitBtnDecline]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.submitBtnText}>
                  {form.statut === 'CONFIRME' ? '🎉 Confirmer ma présence' : '😢 Envoyer ma réponse'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        {wedding.lieuReception && (
          <View style={styles.footerInfo}>
            <Text style={styles.footerTitle}>Informations pratiques</Text>
            {wedding.heureCeremonie && (
              <Text style={styles.footerItem}>⛪ Cérémonie à {wedding.heureCeremonie}</Text>
            )}
            {wedding.heureReception && (
              <Text style={styles.footerItem}>🥂 Réception à {wedding.heureReception}</Text>
            )}
            {wedding.lieuReception && (
              <Text style={styles.footerItem}>📍 {wedding.lieuReception}</Text>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: COLORS.muted },
  errorEmoji: { fontSize: 52, marginBottom: 12 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  errorText: { fontSize: 14, color: COLORS.muted, textAlign: 'center' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  header: { backgroundColor: COLORS.primary, padding: 32, alignItems: 'center' },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, textAlign: 'center', marginBottom: 4 },
  headerDate: { fontSize: 14, color: COLORS.accent, marginBottom: 4 },
  headerLieu: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  card: { backgroundColor: COLORS.white, margin: 16, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 20, textAlign: 'center' },
  statutRow: { flexDirection: 'column', gap: 10, marginBottom: 20 },
  statutChip: { padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  statutChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  row: { flexDirection: 'row', marginBottom: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray },
  inputError: { borderColor: COLORS.error },
  //errorText: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  togglesRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  toggleChip: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white },
  toggleChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnDecline: { backgroundColor: COLORS.danger },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footerInfo: { backgroundColor: COLORS.white, marginHorizontal: 16, borderRadius: 16, padding: 20 },
  footerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  footerItem: { fontSize: 13, color: COLORS.muted, marginBottom: 6 },
  confirmScroll: { flexGrow: 1, padding: 24 },
  confirmHeader: { alignItems: 'center', paddingVertical: 32 },
  confirmEmoji: { fontSize: 56, marginBottom: 12 },
  confirmTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  confirmName: { fontSize: 16, color: COLORS.muted },
  confirmCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  confirmCardTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16, textAlign: 'center' },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  confirmLabel: { fontSize: 13, color: COLORS.muted },
  confirmValue: { fontSize: 13, fontWeight: '600', color: COLORS.text, flex: 1, textAlign: 'right', marginLeft: 10 },
  reminderNote: { backgroundColor: COLORS.primary + '10', borderRadius: 12, padding: 16, marginBottom: 16 },
  reminderText: { fontSize: 13, color: COLORS.primary, textAlign: 'center', lineHeight: 20 },
  thankYou: { fontSize: 15, color: COLORS.muted, textAlign: 'center', lineHeight: 24, paddingHorizontal: 16 },
})
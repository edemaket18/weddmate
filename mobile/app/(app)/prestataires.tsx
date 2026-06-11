 import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useWeddingStore } from '../../store/wedding.store'
import { api } from '../../lib/api'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', success: '#38A169', warning: '#D69E2E',
  danger: '#E53E3E', info: '#3182CE',
}

const STATUT_COLORS: Record<string, string> = {
  CONTACTE: COLORS.muted, EN_ATTENTE: COLORS.warning,
  CONFIRME: COLORS.success, PAYE: COLORS.info, ANNULE: COLORS.danger,
}
const STATUT_LABELS: Record<string, string> = {
  CONTACTE: 'Contacté', EN_ATTENTE: 'En attente',
  CONFIRME: 'Confirmé', PAYE: 'Payé', ANNULE: 'Annulé',
}
const CATEGORIES = [
  'LIEU','TRAITEUR','PHOTOGRAPHE','VIDEASTE','DJ_MUSIQUE',
  'ORCHESTRE','FLEURISTE','DECORATION','OFFICIANT',
  'COIFFURE_MAQUILLAGE','TRANSPORT','GATEAU','ANIMATION','AUTRE'
]
const CAT_EMOJI: Record<string, string> = {
  LIEU:'🏛️',TRAITEUR:'🍽️',PHOTOGRAPHE:'📸',VIDEASTE:'🎥',
  DJ_MUSIQUE:'🎧',ORCHESTRE:'🎶',FLEURISTE:'💐',DECORATION:'✨',
  OFFICIANT:'⛪',COIFFURE_MAQUILLAGE:'💄',TRANSPORT:'🚗',
  GATEAU:'🎂',ANIMATION:'🎭',AUTRE:'📦',
}

interface Presta {
  id: string
  statut: string
  montantDevis: number | null
  montantAcompte: number | null
  montantSolde: number | null
  prestataire: {
    nomEntreprise: string; nomContact: string
    telephone: string; whatsapp: string | null
    categorie: string; ville: string | null
  }
}

export default function PrestatairesScreen() {
  const { currentWedding } = useWeddingStore()
  const [prestas, setPrestas] = useState<Presta[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState<string | null>(null)
  const [form, setForm] = useState({
    nomEntreprise: '', nomContact: '', telephone: '',
    whatsapp: '', categorie: 'PHOTOGRAPHE',
    montantDevis: '', ville: '',
  })

  const fetchPrestas = useCallback(async () => {
    if (!currentWedding) return
    setLoading(true)
    try {
      const url = filterStatut
        ? `/api/weddings/${currentWedding.id}/prestataires?statut=${filterStatut}`
        : `/api/weddings/${currentWedding.id}/prestataires`
      const { data } = await api.get(url)
      setPrestas(data.data)
    } catch {}
    setLoading(false)
  }, [currentWedding, filterStatut])

  useEffect(() => { fetchPrestas() }, [fetchPrestas])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPrestas()
    setRefreshing(false)
  }

  const handleAdd = async () => {
    if (!form.nomEntreprise || !form.nomContact || !form.telephone) {
      Alert.alert('Erreur', 'Nom, contact et téléphone sont requis')
      return
    }
    setSaving(true)
    try {
      await api.post(`/api/weddings/${currentWedding!.id}/prestataires`, {
        nomEntreprise: form.nomEntreprise.trim(),
        nomContact: form.nomContact.trim(),
        telephone: form.telephone.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        categorie: form.categorie,
        montantDevis: form.montantDevis ? Number(form.montantDevis) : undefined,
        ville: form.ville.trim() || undefined,
      })
      setShowModal(false)
      setForm({ nomEntreprise:'',nomContact:'',telephone:'',whatsapp:'',categorie:'PHOTOGRAPHE',montantDevis:'',ville:'' })
      await fetchPrestas()
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de l\'ajout')
    }
    setSaving(false)
  }

  const handleStatut = async (presta: Presta, newStatut: string) => {
    try {
      await api.patch(`/api/weddings/${currentWedding!.id}/prestataires/${presta.id}`, { statut: newStatut })
      await fetchPrestas()
    } catch {}
  }

  const handleDelete = (presta: Presta) => {
    Alert.alert('Supprimer', `Retirer ${presta.prestataire.nomEntreprise} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`/api/weddings/${currentWedding!.id}/prestataires/${presta.id}`)
        await fetchPrestas()
      }},
    ])
  }

  if (!currentWedding) return (
    <View style={styles.center}>
      <Text style={styles.noWedding}>Créez d'abord un mariage</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤝 Prestataires</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Filtres statut */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, !filterStatut && styles.filterChipActive]}
          onPress={() => setFilterStatut(null)}
        >
          <Text style={[styles.filterText, !filterStatut && styles.filterTextActive]}>Tous</Text>
        </TouchableOpacity>
        {Object.entries(STATUT_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterChip, filterStatut === key && styles.filterChipActive]}
            onPress={() => setFilterStatut(filterStatut === key ? null : key)}
          >
            <Text style={[styles.filterText, filterStatut === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : prestas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤝</Text>
            <Text style={styles.emptyText}>Aucun prestataire{filterStatut ? ' avec ce statut' : ''}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyBtnText}>+ Ajouter un prestataire</Text>
            </TouchableOpacity>
          </View>
        ) : (
          prestas.map(p => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.catEmoji}>{CAT_EMOJI[p.prestataire.categorie] || '📦'}</Text>
                  <View>
                    <Text style={styles.nomEntreprise}>{p.prestataire.nomEntreprise}</Text>
                    <Text style={styles.nomContact}>{p.prestataire.nomContact}</Text>
                    {p.prestataire.ville ? <Text style={styles.ville}>📍 {p.prestataire.ville}</Text> : null}
                  </View>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[p.statut] + '20', borderColor: STATUT_COLORS[p.statut] }]}>
                  <Text style={[styles.statutText, { color: STATUT_COLORS[p.statut] }]}>{STATUT_LABELS[p.statut]}</Text>
                </View>
              </View>

              {p.montantDevis ? (
                <View style={styles.montants}>
                  <Text style={styles.montantItem}>Devis: {p.montantDevis.toLocaleString()} FCFA</Text>
                  {p.montantAcompte ? <Text style={styles.montantItem}>Acompte: {p.montantAcompte.toLocaleString()}</Text> : null}
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionChip} onPress={() => handleStatut(p, 'CONFIRME')}>
                  <Text style={styles.actionChipText}>✓ Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionChip} onPress={() => handleStatut(p, 'PAYE')}>
                  <Text style={styles.actionChipText}>💰 Payé</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionChip, styles.deleteChip]} onPress={() => handleDelete(p)}>
                  <Text style={[styles.actionChipText, { color: COLORS.danger }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal ajout */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ajouter un prestataire</Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.modalSave}>Ajouter</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {[
              { key: 'nomEntreprise', label: 'Nom entreprise *', placeholder: 'Studio Photo Lomé' },
              { key: 'nomContact', label: 'Nom contact *', placeholder: 'Jean Amedé' },
              { key: 'telephone', label: 'Téléphone *', placeholder: '+228 90 00 00 00', keyboard: 'phone-pad' },
              { key: 'whatsapp', label: 'WhatsApp', placeholder: '+228 90 00 00 00', keyboard: 'phone-pad' },
              { key: 'montantDevis', label: 'Devis (FCFA)', placeholder: '350000', keyboard: 'numeric' },
              { key: 'ville', label: 'Ville', placeholder: 'Lomé' },
            ].map(f => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.muted}
                  value={form[f.key as keyof typeof form]}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                  keyboardType={(f as any).keyboard || 'default'}
                />
              </View>
            ))}
            <Text style={styles.fieldLabel}>Catégorie</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, form.categorie === cat && styles.catChipActive]}
                  onPress={() => setForm(prev => ({ ...prev, categorie: cat }))}
                >
                  <Text style={styles.catChipText}>{CAT_EMOJI[cat]} {cat.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noWedding: { color: COLORS.muted, fontSize: 16 },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  filters: { paddingVertical: 12, paddingHorizontal: 16, maxHeight: 56 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.white },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.muted },
  filterTextActive: { color: COLORS.white, fontWeight: '600' },
  list: { flex: 1, paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15, marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardLeft: { flexDirection: 'row', gap: 10, flex: 1 },
  catEmoji: { fontSize: 28 },
  nomEntreprise: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  nomContact: { fontSize: 13, color: COLORS.muted, marginTop: 1 },
  ville: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statutText: { fontSize: 11, fontWeight: '600' },
  montants: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  montantItem: { fontSize: 12, color: COLORS.muted },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.gray },
  deleteChip: { marginLeft: 'auto' as any },
  actionChipText: { fontSize: 12, color: COLORS.text },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingTop: 56 },
  modalCancel: { color: COLORS.muted, fontSize: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalSave: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  modalBody: { padding: 16 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.white },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.text },
})
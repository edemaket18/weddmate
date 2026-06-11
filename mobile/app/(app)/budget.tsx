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
  PREVU: COLORS.muted, ACOMPTE: COLORS.warning, SOLDE: COLORS.success,
}
const CATEGORIES = [
  'LIEU','TRAITEUR','PHOTOGRAPHE','VIDEASTE','DJ_MUSIQUE',
  'FLEURISTE','DECORATION','TRANSPORT','GATEAU','AUTRE'
]

interface BudgetItem {
  id: string; libelle: string; categorie: string
  montantPrevu: number; montantPaye: number; statut: string
  notes: string | null
}

interface Synthese {
  budgetTotal: number; totalPrevu: number; totalPaye: number
  totalRestant: number; tauxConsommation: number
  parCategorie: Record<string, { prevu: number; paye: number }>
}

export default function BudgetScreen() {
  const { currentWedding } = useWeddingStore()
  const [items, setItems] = useState<BudgetItem[]>([])
  const [synthese, setSynthese] = useState<Synthese | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    libelle: '', categorie: 'AUTRE',
    montantPrevu: '', montantPaye: '', notes: '',
  })

  const fetchBudget = useCallback(async () => {
    if (!currentWedding) return
    setLoading(true)
    try {
      const { data } = await api.get(`/api/weddings/${currentWedding.id}/budget`)
      setItems(data.data.items)
      setSynthese(data.data.synthese)
    } catch {}
    setLoading(false)
  }, [currentWedding])

  useEffect(() => { fetchBudget() }, [fetchBudget])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchBudget()
    setRefreshing(false)
  }

  const handleAdd = async () => {
    if (!form.libelle || !form.montantPrevu) {
      Alert.alert('Erreur', 'Libellé et montant prévu sont requis')
      return
    }
    setSaving(true)
    try {
      await api.post(`/api/weddings/${currentWedding!.id}/budget`, {
        libelle: form.libelle.trim(),
        categorie: form.categorie,
        montantPrevu: Number(form.montantPrevu),
        montantPaye: form.montantPaye ? Number(form.montantPaye) : 0,
        notes: form.notes.trim() || undefined,
      })
      setShowModal(false)
      setForm({ libelle:'', categorie:'AUTRE', montantPrevu:'', montantPaye:'', notes:'' })
      await fetchBudget()
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de l\'ajout')
    }
    setSaving(false)
  }

  const handlePayer = async (item: BudgetItem) => {
    try {
      await api.patch(`/api/weddings/${currentWedding!.id}/budget/${item.id}`, {
        montantPaye: item.montantPrevu,
      })
      await fetchBudget()
    } catch {}
  }

  const handleDelete = (item: BudgetItem) => {
    Alert.alert('Supprimer', `Supprimer "${item.libelle}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`/api/weddings/${currentWedding!.id}/budget/${item.id}`)
        await fetchBudget()
      }},
    ])
  }

  if (!currentWedding) return (
    <View style={styles.center}><Text style={styles.noWedding}>Créez d'abord un mariage</Text></View>
  )

  const taux = synthese?.tauxConsommation ?? 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💰 Budget</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
      >
        {/* Synthèse */}
        {synthese && (
          <View style={styles.syntheseCard}>
            <Text style={styles.syntheseTitle}>Récapitulatif</Text>
            <View style={styles.syntheseRow}>
              <Text style={styles.syntheseLabel}>Budget total</Text>
              <Text style={styles.syntheseValue}>{synthese.budgetTotal.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.syntheseRow}>
              <Text style={styles.syntheseLabel}>Prévu</Text>
              <Text style={styles.syntheseValue}>{synthese.totalPrevu.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.syntheseRow}>
              <Text style={styles.syntheseLabel}>Payé</Text>
              <Text style={[styles.syntheseValue, { color: COLORS.warning }]}>{synthese.totalPaye.toLocaleString()} FCFA</Text>
            </View>
            <View style={[styles.syntheseRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.syntheseLabel}>Restant</Text>
              <Text style={[styles.syntheseValue, { color: synthese.totalRestant < 0 ? COLORS.danger : COLORS.success }]}>
                {synthese.totalRestant.toLocaleString()} FCFA
              </Text>
            </View>
            {/* Barre progression */}
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>Taux de paiement</Text>
                <Text style={styles.progressPct}>{taux}%</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(taux, 100)}%` as any, backgroundColor: taux > 90 ? COLORS.success : COLORS.accent }]} />
              </View>
            </View>
          </View>
        )}

        {/* Items */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Items ({items.length})</Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💰</Text>
              <Text style={styles.emptyText}>Aucun item budgétaire</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.emptyBtnText}>+ Ajouter un item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map(item => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLibelle}>{item.libelle}</Text>
                    <Text style={styles.itemCat}>{item.categorie.replace('_', ' ')}</Text>
                  </View>
                  <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[item.statut] + '20' }]}>
                    <Text style={[styles.statutText, { color: STATUT_COLORS[item.statut] }]}>{item.statut}</Text>
                  </View>
                </View>
                <View style={styles.montantsRow}>
                  <View>
                    <Text style={styles.montantLabel}>Prévu</Text>
                    <Text style={styles.montantVal}>{item.montantPrevu.toLocaleString()}</Text>
                  </View>
                  <View>
                    <Text style={styles.montantLabel}>Payé</Text>
                    <Text style={[styles.montantVal, { color: COLORS.warning }]}>{item.montantPaye.toLocaleString()}</Text>
                  </View>
                  <View>
                    <Text style={styles.montantLabel}>Reste</Text>
                    <Text style={[styles.montantVal, { color: COLORS.success }]}>{(item.montantPrevu - item.montantPaye).toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  {item.statut !== 'SOLDE' && (
                    <TouchableOpacity style={styles.actionChip} onPress={() => handlePayer(item)}>
                      <Text style={styles.actionChipText}>✓ Solder</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionChip, styles.deleteChip]} onPress={() => handleDelete(item)}>
                    <Text style={[styles.actionChipText, { color: COLORS.danger }]}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal ajout */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel item budget</Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.modalSave}>Ajouter</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {[
              { key: 'libelle', label: 'Libellé *', placeholder: 'Traiteur Kossivi' },
              { key: 'montantPrevu', label: 'Montant prévu (FCFA) *', placeholder: '600000', keyboard: 'numeric' },
              { key: 'montantPaye', label: 'Déjà payé (FCFA)', placeholder: '0', keyboard: 'numeric' },
              { key: 'notes', label: 'Notes', placeholder: 'Optionnel' },
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
                  <Text style={[styles.catChipText, form.categorie === cat && { color: COLORS.white }]}>
                    {cat.replace('_', ' ')}
                  </Text>
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
  syntheseCard: { margin: 16, backgroundColor: COLORS.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  syntheseTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  syntheseRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  syntheseLabel: { fontSize: 14, color: COLORS.muted },
  syntheseValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 13, color: COLORS.muted },
  progressPct: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  track: { height: 8, backgroundColor: COLORS.gray, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15, marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  itemLibelle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  itemCat: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statutText: { fontSize: 11, fontWeight: '600' },
  montantsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  montantLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 2 },
  montantVal: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.gray },
  deleteChip: { marginLeft: 'auto' as any },
  actionChipText: { fontSize: 12, color: COLORS.text },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingTop: 56 },
  modalCancel: { color: COLORS.muted, fontSize: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalSave: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray },
  catChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.white },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.text },
})
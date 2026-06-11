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
  muted: '#6B7C93', success: '#38A169', warning: '#D69E2E', danger: '#E53E3E',
}

const PRIORITE_COLORS: Record<number, string> = {
  1: COLORS.danger, 2: COLORS.warning, 3: COLORS.success,
}
const PRIORITE_LABELS: Record<number, string> = {
  1: '🔴 Haute', 2: '🟡 Normale', 3: '🟢 Basse',
}

interface Tache {
  id: string; titre: string; description: string | null
  echeance: string | null; faite: boolean
  priorite: number; categorie: string | null
}

interface Meta {
  total: number; faites: number; enRetard: number; progression: number
}

export default function TachesScreen() {
  const { currentWedding } = useWeddingStore()
  const [taches, setTaches] = useState<Tache[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterFaite, setFilterFaite] = useState<boolean | null>(null)
  const [filterPriorite, setFilterPriorite] = useState<number | null>(null)
  const [form, setForm] = useState({
    titre: '', description: '', echeance: '',
    priorite: 2, categorie: '',
  })

  const fetchTaches = useCallback(async () => {
    if (!currentWedding) return
    setLoading(true)
    try {
      let url = `/api/weddings/${currentWedding.id}/taches?`
      if (filterFaite !== null) url += `faite=${filterFaite}&`
      if (filterPriorite !== null) url += `priorite=${filterPriorite}&`
      const { data } = await api.get(url)
      setTaches(data.data)
      setMeta(data.meta)
    } catch {}
    setLoading(false)
  }, [currentWedding, filterFaite, filterPriorite])

  useEffect(() => { fetchTaches() }, [fetchTaches])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchTaches()
    setRefreshing(false)
  }

  const handleToggle = async (tache: Tache) => {
    try {
      await api.post(`/api/weddings/${currentWedding!.id}/taches/${tache.id}/toggle`)
      await fetchTaches()
    } catch {}
  }

  const handleAdd = async () => {
    if (!form.titre.trim()) {
      Alert.alert('Erreur', 'Le titre est requis')
      return
    }
    setSaving(true)
    try {
      await api.post(`/api/weddings/${currentWedding!.id}/taches`, {
        titre: form.titre.trim(),
        description: form.description.trim() || undefined,
        priorite: form.priorite,
        categorie: form.categorie.trim() || undefined,
        echeance: form.echeance.trim()
          ? (() => {
              const parts = form.echeance.split('/')
              return parts.length === 3
                ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00.000Z`).toISOString()
                : undefined
            })()
          : undefined,
      })
      setShowModal(false)
      setForm({ titre:'', description:'', echeance:'', priorite:2, categorie:'' })
      await fetchTaches()
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur lors de l\'ajout')
    }
    setSaving(false)
  }

  const handleDelete = (tache: Tache) => {
    Alert.alert('Supprimer', `Supprimer "${tache.titre}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`/api/weddings/${currentWedding!.id}/taches/${tache.id}`)
        await fetchTaches()
      }},
    ])
  }

  const handleClearFaites = () => {
    Alert.alert('Vider les tâches faites', 'Supprimer toutes les tâches cochées ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: async () => {
        await api.delete(`/api/weddings/${currentWedding!.id}/taches?faiteOnly=true`)
        await fetchTaches()
      }},
    ])
  }

  if (!currentWedding) return (
    <View style={styles.center}><Text style={styles.noWedding}>Créez d'abord un mariage</Text></View>
  )

  const progression = meta?.progression ?? 0

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✅ Tâches</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* Progression */}
      {meta && (
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{meta.faites}/{meta.total} tâches · {meta.enRetard} en retard</Text>
            <Text style={[styles.progressPct, { color: progression === 100 ? COLORS.success : COLORS.primary }]}>
              {progression}%
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, {
              width: `${progression}%` as any,
              backgroundColor: progression === 100 ? COLORS.success : COLORS.accent,
            }]} />
          </View>
        </View>
      )}

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, filterFaite === null && filterPriorite === null && styles.filterChipActive]}
          onPress={() => { setFilterFaite(null); setFilterPriorite(null) }}
        >
          <Text style={[styles.filterText, filterFaite === null && filterPriorite === null && styles.filterTextActive]}>Toutes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterFaite === false && styles.filterChipActive]}
          onPress={() => { setFilterFaite(false); setFilterPriorite(null) }}
        >
          <Text style={[styles.filterText, filterFaite === false && styles.filterTextActive]}>À faire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filterFaite === true && styles.filterChipActive]}
          onPress={() => { setFilterFaite(true); setFilterPriorite(null) }}
        >
          <Text style={[styles.filterText, filterFaite === true && styles.filterTextActive]}>✓ Faites</Text>
        </TouchableOpacity>
        {[1, 2, 3].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.filterChip, filterPriorite === p && styles.filterChipActive]}
            onPress={() => { setFilterPriorite(filterPriorite === p ? null : p); setFilterFaite(null) }}
          >
            <Text style={[styles.filterText, filterPriorite === p && styles.filterTextActive]}>
              {PRIORITE_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : taches.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>Aucune tâche</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.emptyBtnText}>+ Ajouter une tâche</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {taches.map(tache => {
              const isLate = !tache.faite && tache.echeance && new Date(tache.echeance) < new Date()
              return (
                <View key={tache.id} style={[styles.card, tache.faite && styles.cardDone]}>
                  <View style={styles.cardTop}>
                    {/* Checkbox */}
                    <TouchableOpacity style={styles.checkbox} onPress={() => handleToggle(tache)}>
                      <View style={[styles.checkboxInner, tache.faite && styles.checkboxChecked]}>
                        {tache.faite && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tacheTitre, tache.faite && styles.tacheTitreDone]}>
                        {tache.titre}
                      </Text>
                      {tache.description ? (
                        <Text style={styles.tacheDesc}>{tache.description}</Text>
                      ) : null}
                      <View style={styles.tacheMeta}>
                        <View style={[styles.prioriteBadge, { backgroundColor: PRIORITE_COLORS[tache.priorite] + '20' }]}>
                          <Text style={[styles.prioriteText, { color: PRIORITE_COLORS[tache.priorite] }]}>
                            {PRIORITE_LABELS[tache.priorite]}
                          </Text>
                        </View>
                        {tache.categorie ? (
                          <Text style={styles.categorie}>{tache.categorie}</Text>
                        ) : null}
                      </View>
                      {tache.echeance ? (
                        <Text style={[styles.echeance, isLate && styles.echeanceLate]}>
                          📅 {new Date(tache.echeance).toLocaleDateString('fr-FR')}
                          {isLate ? ' ⚠️ En retard' : ''}
                        </Text>
                      ) : null}
                    </View>

                    <TouchableOpacity onPress={() => handleDelete(tache)} style={styles.deleteBtn}>
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}

            {(meta?.faites ?? 0) > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearFaites}>
                <Text style={styles.clearBtnText}>🗑️ Vider les tâches cochées ({meta?.faites})</Text>
              </TouchableOpacity>
            )}
          </View>
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
            <Text style={styles.modalTitle}>Nouvelle tâche</Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.modalSave}>Ajouter</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {[
              { key: 'titre', label: 'Titre *', placeholder: 'Ex: Confirmer le traiteur' },
              { key: 'description', label: 'Description', placeholder: 'Optionnel' },
              { key: 'echeance', label: 'Échéance (JJ/MM/AAAA)', placeholder: '15/09/2026' },
              { key: 'categorie', label: 'Catégorie', placeholder: 'Ex: Administratif' },
            ].map(f => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={COLORS.muted}
                  value={form[f.key as keyof typeof form] as string}
                  onChangeText={v => setForm(prev => ({ ...prev, [f.key]: v }))}
                />
              </View>
            ))}

            <Text style={styles.fieldLabel}>Priorité</Text>
            <View style={styles.prioriteRow}>
              {[1, 2, 3].map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.prioriteChip, form.priorite === p && styles.prioriteChipActive]}
                  onPress={() => setForm(prev => ({ ...prev, priorite: p }))}
                >
                  <Text style={[styles.prioriteChipText, form.priorite === p && { color: COLORS.white }]}>
                    {PRIORITE_LABELS[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
  progressCard: { backgroundColor: COLORS.white, padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { fontSize: 13, color: COLORS.muted },
  progressPct: { fontSize: 13, fontWeight: '700' },
  track: { height: 8, backgroundColor: COLORS.gray, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  filters: { paddingVertical: 10, paddingHorizontal: 16, maxHeight: 52 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, backgroundColor: COLORS.white },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.muted },
  filterTextActive: { color: COLORS.white, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.muted, fontSize: 15, marginBottom: 20 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardDone: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { marginTop: 2 },
  checkboxInner: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  checkmark: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  tacheTitre: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  tacheTitreDone: { textDecorationLine: 'line-through', color: COLORS.muted },
  tacheDesc: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  tacheMeta: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  prioriteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  prioriteText: { fontSize: 10, fontWeight: '600' },
  categorie: { fontSize: 11, color: COLORS.muted },
  echeance: { fontSize: 12, color: COLORS.muted },
  echeanceLate: { color: COLORS.danger, fontWeight: '600' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  clearBtn: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: COLORS.danger + '40' },
  clearBtnText: { color: COLORS.danger, fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, backgroundColor: COLORS.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, paddingTop: 56 },
  modalCancel: { color: COLORS.muted, fontSize: 15 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  modalSave: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray },
  prioriteRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  prioriteChip: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white },
  prioriteChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  prioriteChipText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
})
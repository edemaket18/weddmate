 import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, RefreshControl, Share,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useWeddingStore } from '../../store/wedding.store'
import { API_BASE_URL, api } from '../../lib/api'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', success: '#38A169', warning: '#D69E2E',
  danger: '#E53E3E',
}

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: COLORS.muted, CONFIRME: COLORS.success,
  DECLINE: COLORS.danger, LISTE_ATTENTE: COLORS.warning,
}
const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente', CONFIRME: 'Confirmé',
  DECLINE: 'Décliné', LISTE_ATTENTE: 'Liste attente',
}

interface Invite {
  id: string; nom: string; prenom: string
  telephone: string | null; whatsapp: string | null
  statut: string; nombreAccompa: number
  tableAssignee: string | null; cote: string | null
  transport: boolean; rsvpSource: string
}

interface Stats {
  total: number; confirmes: number; declines: number
  enAttente: number; totalPersonnes: number; transport: number
}

export default function InvitesScreen() {
  const { currentWedding } = useWeddingStore()
  const [invites, setInvites] = useState<Invite[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState<string | null>(null)
  const [form, setForm] = useState({
    nom: '', prenom: '', whatsapp: '',
    cote: 'MARIE', nombreAccompa: '0',
  })

  const fetchInvites = useCallback(async () => {
    if (!currentWedding) return
    setLoading(true)
    try {
      const url = filterStatut
        ? `/api/weddings/${currentWedding.id}/invites?statut=${filterStatut}`
        : `/api/weddings/${currentWedding.id}/invites`
      const [invRes, statsRes] = await Promise.all([
        api.get(url),
        api.get(`/api/weddings/${currentWedding.id}/invites/stats`),
      ])
      setInvites(invRes.data.data)
      setStats(statsRes.data.data)
    } catch {}
    setLoading(false)
  }, [currentWedding, filterStatut])

  useEffect(() => { fetchInvites() }, [fetchInvites])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchInvites()
    setRefreshing(false)
  }

  const handleShareRsvp = async () => {
    if (!currentWedding) return
    const url = `${API_BASE_URL}/rsvp/${currentWedding.slug}`
    try {
      await Share.share({
        message: `💍 Vous êtes invité(e) au ${currentWedding.nomCeremonie} !\n\nConfirmez votre présence ici :\n${url}`,
        title: 'Invitation mariage',
      })
    } catch {}
  }

  const handleAdd = async () => {
    if (!form.nom || !form.prenom) {
      Alert.alert('Erreur', 'Nom et prénom sont requis')
      return
    }
    setSaving(true)
    try {
      await api.post(`/api/weddings/${currentWedding!.id}/invites`, {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        whatsapp: form.whatsapp.trim() || undefined,
        cote: form.cote,
        nombreAccompa: Number(form.nombreAccompa) || 0,
      })
      setShowModal(false)
      setForm({ nom:'', prenom:'', whatsapp:'', cote:'MARIE', nombreAccompa:'0' })
      await fetchInvites()
    } catch (e: any) {
      Alert.alert('Erreur', e?.response?.data?.error || 'Erreur')
    }
    setSaving(false)
  }

  const handleStatut = async (invite: Invite, statut: string) => {
    try {
      await api.patch(`/api/weddings/${currentWedding!.id}/invites/${invite.id}`, { statut })
      await fetchInvites()
    } catch {}
  }

  const handleDelete = (invite: Invite) => {
    Alert.alert('Supprimer', `Supprimer ${invite.prenom} ${invite.nom} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await api.delete(`/api/weddings/${currentWedding!.id}/invites/${invite.id}`)
        await fetchInvites()
      }},
    ])
  }

  if (!currentWedding) return (
    <View style={styles.center}><Text style={styles.noWedding}>Créez d'abord un mariage</Text></View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Invités</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShareRsvp}>
            <Text style={styles.shareBtnText}>📩 RSVP</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.addBtnText}>+ Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats bar */}
      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: COLORS.success }]}>{stats.confirmes}</Text>
            <Text style={styles.statLbl}>Confirmés</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: COLORS.danger }]}>{stats.declines}</Text>
            <Text style={styles.statLbl}>Déclinés</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: COLORS.muted }]}>{stats.enAttente}</Text>
            <Text style={styles.statLbl}>En attente</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: COLORS.primary }]}>{stats.totalPersonnes}</Text>
            <Text style={styles.statLbl}>Personnes</Text>
          </View>
        </View>
      )}

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <TouchableOpacity style={[styles.filterChip, !filterStatut && styles.filterChipActive]} onPress={() => setFilterStatut(null)}>
          <Text style={[styles.filterText, !filterStatut && styles.filterTextActive]}>Tous</Text>
        </TouchableOpacity>
        {Object.entries(STATUT_LABELS).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.filterChip, filterStatut === key && styles.filterChipActive]} onPress={() => setFilterStatut(filterStatut === key ? null : key)}>
            <Text style={[styles.filterText, filterStatut === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : invites.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👥</Text>
            <Text style={styles.emptyText}>Aucun invité{filterStatut ? ' avec ce statut' : ''}</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleShareRsvp}>
              <Text style={styles.emptyBtnText}>📩 Partager le lien RSVP</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {invites.map(inv => (
              <View key={inv.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{inv.prenom[0]}{inv.nom[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inviteName}>{inv.prenom} {inv.nom}</Text>
                    <Text style={styles.inviteSub}>
                      {inv.cote === 'MARIE' ? '🤵 Côté marié' : '👰 Côté mariée'}
                      {inv.nombreAccompa > 0 ? ` · +${inv.nombreAccompa}` : ''}
                      {inv.transport ? ' · 🚗' : ''}
                    </Text>
                  </View>
                  <View style={[styles.statutBadge, { backgroundColor: STATUT_COLORS[inv.statut] + '20' }]}>
                    <Text style={[styles.statutText, { color: STATUT_COLORS[inv.statut] }]}>
                      {STATUT_LABELS[inv.statut]}
                    </Text>
                  </View>
                </View>
                {inv.tableAssignee && (
                  <Text style={styles.table}>🪑 {inv.tableAssignee}</Text>
                )}
                <View style={styles.cardActions}>
                  {inv.statut !== 'CONFIRME' && (
                    <TouchableOpacity style={styles.actionChip} onPress={() => handleStatut(inv, 'CONFIRME')}>
                      <Text style={styles.actionChipText}>✓ Confirmer</Text>
                    </TouchableOpacity>
                  )}
                  {inv.statut !== 'DECLINE' && (
                    <TouchableOpacity style={styles.actionChip} onPress={() => handleStatut(inv, 'DECLINE')}>
                      <Text style={styles.actionChipText}>✗ Décliner</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.actionChip, styles.deleteChip]} onPress={() => handleDelete(inv)}>
                    <Text style={[styles.actionChipText, { color: COLORS.danger }]}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Ajouter un invité</Text>
            <TouchableOpacity onPress={handleAdd} disabled={saving}>
              {saving ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.modalSave}>Ajouter</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            {[
              { key: 'prenom', label: 'Prénom *', placeholder: 'Kokou' },
              { key: 'nom', label: 'Nom *', placeholder: 'Mensah' },
              { key: 'whatsapp', label: 'WhatsApp', placeholder: '+228 90 00 00 00', keyboard: 'phone-pad' },
              { key: 'nombreAccompa', label: 'Accompagnants', placeholder: '0', keyboard: 'numeric' },
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
            <Text style={styles.fieldLabel}>Côté</Text>
            <View style={styles.coteRow}>
              {['MARIE', 'MARIEE'].map(c => (
                <TouchableOpacity key={c} style={[styles.coteChip, form.cote === c && styles.coteChipActive]} onPress={() => setForm(prev => ({ ...prev, cote: c }))}>
                  <Text style={[styles.coteText, form.cote === c && { color: COLORS.white }]}>
                    {c === 'MARIE' ? '🤵 Côté marié' : '👰 Côté mariée'}
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
  headerActions: { flexDirection: 'row', gap: 8 },
  shareBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  shareBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  addBtn: { backgroundColor: COLORS.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  statsBar: { backgroundColor: COLORS.white, flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800' },
  statLbl: { fontSize: 10, color: COLORS.muted, marginTop: 2 },
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
  card: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  inviteName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  inviteSub: { fontSize: 12, color: COLORS.muted, marginTop: 2 },
  statutBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statutText: { fontSize: 10, fontWeight: '600' },
  table: { fontSize: 12, color: COLORS.muted, marginBottom: 8 },
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
  coteRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  coteChip: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.white },
  coteChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  coteText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
})

 import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native'
import { useState, useCallback } from 'react'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/auth.store'
import { useWeddingStore } from '../../store/wedding.store'
import { StatusBar } from 'expo-status-bar'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', success: '#38A169', warning: '#D69E2E',
  danger: '#E53E3E', info: '#3182CE',
}

function StatCard({ emoji, value, label, color }: {
  emoji: string; value: string | number; label: string; color: string
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function CountdownCard({ joursRestants, nomCeremonie, dateJourJ }: {
  joursRestants: number; nomCeremonie: string; dateJourJ: string
}) {
  const date = new Date(dateJourJ).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  const urgency = joursRestants <= 7 ? COLORS.danger
    : joursRestants <= 30 ? COLORS.warning
    : COLORS.accent

  return (
    <View style={styles.countdown}>
      <Text style={styles.countdownTitle}>💍 {nomCeremonie}</Text>
      <Text style={styles.countdownDate}>{date}</Text>
      <View style={styles.countdownBadge}>
        <Text style={[styles.countdownDays, { color: urgency }]}>
          {joursRestants}
        </Text>
        <Text style={styles.countdownLabel}>
          {joursRestants === 0 ? "C'est aujourd'hui ! 🎉"
            : joursRestants === 1 ? "jour restant ⚡"
            : "jours restants"}
        </Text>
      </View>
    </View>
  )
}

export default function DashboardScreen() {
  const { user, logout } = useAuthStore()
  const { currentWedding, stats, fetchWeddings, fetchStats } = useWeddingStore()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchWeddings()
    if (currentWedding) await fetchStats(currentWedding.id)
    setRefreshing(false)
  }, [currentWedding])

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: async () => {
        await logout()
        router.replace('/(auth)/login')
      }},
    ])
  }

  const progression = stats && stats.tachesTotal > 0
    ? Math.round((stats.tachesFaites / stats.tachesTotal) * 100)
    : 0

  const budgetPct = stats && stats.budgetTotal > 0
    ? Math.round((stats.budgetConsomme / stats.budgetTotal) * 100)
    : 0

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.prenom} 👋</Text>
          <Text style={styles.subGreeting}>Bienvenue sur WeddMate</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[COLORS.accent]} tintColor={COLORS.accent} />
        }
      >
        {!currentWedding ? (
          /* Pas encore de mariage */
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💍</Text>
            <Text style={styles.emptyTitle}>Créez votre mariage</Text>
            <Text style={styles.emptyText}>
              Commencez à planifier votre grand jour en créant votre profil mariage.
            </Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push('/(app)/create-wedding')}
            >
              <Text style={styles.createBtnText}>+ Créer mon mariage</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Compte à rebours */}
            {stats && (
              <CountdownCard
                joursRestants={stats.joursRestants}
                nomCeremonie={currentWedding.nomCeremonie}
                dateJourJ={currentWedding.dateJourJ}
              />
            )}

            {/* Stats */}
            <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
            <View style={styles.statsGrid}>
              <StatCard
                emoji="💰"
                value={`${budgetPct}%`}
                label="Budget utilisé"
                color={budgetPct > 80 ? COLORS.danger : COLORS.info}
              />
              <StatCard
                emoji="👥"
                value={stats?.invitesConfirmes ?? 0}
                label="Invités confirmés"
                color={COLORS.success}
              />
              <StatCard
                emoji="🤝"
                value={`${stats?.prestatairesConfirmes ?? 0}/${stats?.prestatairesTotal ?? 0}`}
                label="Prestataires"
                color={COLORS.accent}
              />
              <StatCard
                emoji="✅"
                value={`${progression}%`}
                label="Checklist"
                color={COLORS.success}
              />
            </View>

            {/* Progression checklist */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Checklist de préparation</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/taches')}>
                  <Text style={styles.seeAll}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {stats?.tachesFaites ?? 0} / {stats?.tachesTotal ?? 0} tâches complétées
                  </Text>
                  <Text style={[styles.progressPct, {
                    color: progression === 100 ? COLORS.success : COLORS.primary
                  }]}>{progression}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, {
                    width: `${progression}%` as any,
                    backgroundColor: progression === 100 ? COLORS.success : COLORS.accent,
                  }]} />
                </View>
              </View>
            </View>

            {/* Budget rapide */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Budget</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/budget')}>
                  <Text style={styles.seeAll}>Voir tout →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.budgetCard}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Total prévu</Text>
                  <Text style={styles.budgetValue}>
                    {(stats?.budgetTotal ?? 0).toLocaleString()} {currentWedding.devise}
                  </Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Dépensé</Text>
                  <Text style={[styles.budgetValue, { color: COLORS.warning }]}>
                    {(stats?.budgetConsomme ?? 0).toLocaleString()} {currentWedding.devise}
                  </Text>
                </View>
                <View style={[styles.budgetRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.budgetLabel}>Restant</Text>
                  <Text style={[styles.budgetValue, {
                    color: (stats?.budgetRestant ?? 0) < 0 ? COLORS.danger : COLORS.success
                  }]}>
                    {(stats?.budgetRestant ?? 0).toLocaleString()} {currentWedding.devise}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions rapides */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions rapides</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push('/(app)/invites')}
                >
                  <Text style={styles.actionEmoji}>📩</Text>
                  <Text style={styles.actionLabel}>Lien RSVP</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push('/(app)/prestataires')}
                >
                  <Text style={styles.actionEmoji}>➕</Text>
                  <Text style={styles.actionLabel}>Prestataire</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push('/(app)/budget')}
                >
                  <Text style={styles.actionEmoji}>💳</Text>
                  <Text style={styles.actionLabel}>Paiement</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => router.push('/(app)/taches')}
                >
                  <Text style={styles.actionEmoji}>📝</Text>
                  <Text style={styles.actionLabel}>Tâche</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 24 }} />
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.gray },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  subGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  logoutBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)' },
  logoutText: { fontSize: 18, color: COLORS.white },
  scroll: { flex: 1 },
  emptyState: { alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  createBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  countdown: {
    margin: 16, backgroundColor: COLORS.primary,
    borderRadius: 16, padding: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  countdownTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  countdownDate: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  countdownBadge: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  countdownDays: { fontSize: 52, fontWeight: '800' },
  countdownLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10, marginBottom: 8,
  },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: COLORS.white,
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statEmoji: { fontSize: 20, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.muted },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  progressCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressText: { fontSize: 13, color: COLORS.muted },
  progressPct: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: COLORS.gray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  budgetCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  budgetRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  budgetLabel: { fontSize: 14, color: COLORS.muted },
  budgetValue: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  actionEmoji: { fontSize: 22, marginBottom: 6 },
  actionLabel: { fontSize: 10, color: COLORS.muted, fontWeight: '500', textAlign: 'center' },
})
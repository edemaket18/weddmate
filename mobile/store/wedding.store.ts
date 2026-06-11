 import { create } from 'zustand'
import { api } from '../lib/api'

interface Wedding {
  id: string
  nomCeremonie: string
  slug: string
  dateJourJ: string
  heureCeremonie: string | null
  heureReception: string | null
  lieuCeremonie: string | null
  lieuReception: string | null
  statut: string
  budgetTotal: number
  devise: string
  rsvpOuvert: boolean
  galerieOuverte: boolean
}

interface WeddingStats {
  joursRestants: number
  budgetTotal: number
  budgetConsomme: number
  budgetRestant: number
  invitesConfirmes: number
  invitesTotal: number
  prestatairesConfirmes: number
  prestatairesTotal: number
  tachesFaites: number
  tachesTotal: number
}

interface WeddingState {
  weddings: Wedding[]
  currentWedding: Wedding | null
  stats: WeddingStats | null
  isLoading: boolean
  fetchWeddings: () => Promise<void>
  fetchStats: (weddingId: string) => Promise<void>
  createWedding: (data: Partial<Wedding>) => Promise<Wedding>
  setCurrentWedding: (wedding: Wedding) => void
  toggleRsvp: (weddingId: string, ouvert: boolean) => Promise<void>
  toggleGalerie: (weddingId: string, ouvert: boolean) => Promise<void>
}

export const useWeddingStore = create<WeddingState>((set, get) => ({
  weddings: [],
  currentWedding: null,
  stats: null,
  isLoading: false,

  fetchWeddings: async () => {
    set({ isLoading: true })
    try {
      const { data } = await api.get('/api/weddings')
      const weddings = data.data
      set({
        weddings,
        currentWedding: weddings.length > 0 ? weddings[0] : null,
        isLoading: false,
      })
      if (weddings.length > 0) {
        get().fetchStats(weddings[0].id)
      }
    } catch {
      set({ isLoading: false })
    }
  },

  fetchStats: async (weddingId: string) => {
    try {
      const { data } = await api.get(`/api/weddings/${weddingId}/stats`)
      set({ stats: data.data })
    } catch {}
  },

  createWedding: async (weddingData) => {
    const { data } = await api.post('/api/weddings', weddingData)
    const wedding = data.data.wedding
    set(state => ({
      weddings: [wedding, ...state.weddings],
      currentWedding: wedding,
    }))
    return wedding
  },

  setCurrentWedding: (wedding) => {
    set({ currentWedding: wedding })
    get().fetchStats(wedding.id)
  },

  toggleRsvp: async (weddingId, ouvert) => {
    await api.patch(`/api/weddings/${weddingId}`, { rsvpOuvert: ouvert })
    await get().fetchWeddings()
  },

  toggleGalerie: async (weddingId, ouvert) => {
    await api.patch(`/api/weddings/${weddingId}`, { galerieOuverte: ouvert })
    await get().fetchWeddings()
  },
}))
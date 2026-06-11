import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Modal, TextInput, Alert, ActivityIndicator,
  RefreshControl, Dimensions, Share,
} from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useWeddingStore } from '../../store/wedding.store'
import { api } from '../../lib/api'
import { uploadPhotoToSupabase } from '../../lib/supabase'
import * as ImagePicker from 'expo-image-picker'
import QRCode from 'react-native-qrcode-svg'

const COLORS = {
  primary: '#1B3A5C', accent: '#C9A84C', white: '#FFFFFF',
  gray: '#F4F6F8', border: '#D0D9E4', text: '#1E2D3D',
  muted: '#6B7C93', success: '#38A169', danger: '#E53E3E',
}

const { width } = Dimensions.get('window')
const PHOTO_SIZE = (width - 48) / 3

interface Photo {
  id: string; url: string; thumbnailUrl: string | null
  uploadePar: string | null; caption: string | null
  validee: boolean; createdAt: string
}

export default function GalerieScreen() {
  const { currentWedding, toggleGalerie } = useWeddingStore()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [showCaption, setShowCaption] = useState(false)
  const [caption, setCaption] = useState('')
  const [pendingUri, setPendingUri] = useState<string | null>(null)

  const galerieUrl = currentWedding
    ? `${process.env.EXPO_PUBLIC_API_URL}/gallery/${currentWedding.slug}`
    : ''

  const fetchPhotos = useCallback(async () => {
    if (!currentWedding) return
    setLoading(true)
    try {
      const { data } = await api.get(`/gallery/${currentWedding.slug}`)
      setPhotos(data.data.photos || [])
    } catch {
      setPhotos([])
    }
    setLoading(false)
  }, [currentWedding])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const onRefresh = async () => {
    setRefreshing(true)
    await fetchPhotos()
    setRefreshing(false)
  }

  const handleToggleGalerie = async () => {
    if (!currentWedding) return
    const newState = !currentWedding.galerieOuverte
    await toggleGalerie(currentWedding.id, newState)
    Alert.alert(
      newState ? '🎉 Galerie ouverte !' : 'Galerie fermée',
      newState
        ? 'Les invités peuvent scanner le QR Code pour partager leurs photos.'
        : 'La galerie est maintenant fermée.',
    )
  }

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `📸 Partagez vos photos du mariage "${currentWedding?.nomCeremonie}" !\n\nAccédez à la galerie ici :\n${galerieUrl}`,
        title: 'Galerie photo mariage',
      })
    } catch {}
  }

  //Sélectionner une photo depuis la galerie 
  const handlePickImage = async () => {
    if (!currentWedding?.galerieOuverte) {
      Alert.alert('Galerie fermée', 'Ouvrez la galerie avant d\'uploader des photos.')
      return
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l\'accès à vos photos pour uploader.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) return

    // Stocker l'URI et ouvrir le modal de légende
    setPendingUri(result.assets[0].uri)
    setCaption('')
    setShowCaption(true)
  }

  //Upload vers Supabase + enregistrement en base 
  const handleUpload = async () => {
    if (!currentWedding || !pendingUri) return
    setShowCaption(false)
    setUploading(true)
    setUploadProgress('Compression de la photo...')

    try {
      // 1. Upload vers Supabase Storage
      setUploadProgress('Upload vers Supabase...')
      const { url, thumbnailUrl, taille } = await uploadPhotoToSupabase(
        pendingUri,
        currentWedding.slug,
        'Marié(e)',
      )

      // 2. Enregistrer en base via l'API backend
      setUploadProgress('Enregistrement...')
      await api.post(`/gallery/${currentWedding.slug}/photos`, {
        url,
        thumbnailUrl,
        uploadePar: 'Marié(e)',
        caption: caption.trim() || null,
        taille,
      })

      setPendingUri(null)
      setCaption('')
      await fetchPhotos()
      Alert.alert('✅ Photo uploadée', 'Votre photo a été ajoutée à la galerie Supabase.')
    } catch (e: any) {
      console.error('[upload]', e)
      Alert.alert(
        'Erreur upload',
        e?.message || e?.response?.data?.error || 'Erreur lors de l\'upload vers Supabase.',
      )
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const handleCancelCaption = () => {
    setShowCaption(false)
    setPendingUri(null)
    setCaption('')
  }

  const handleModerer = async (photo: Photo) => {
    if (!currentWedding) return
    try {
      await api.patch(`/api/weddings/${currentWedding.id}/galerie/${photo.id}`, {
        validee: !photo.validee,
      })
      setSelectedPhoto(prev => prev ? { ...prev, validee: !prev.validee } : null)
      await fetchPhotos()
    } catch {}
  }

  const handleDeletePhoto = (photo: Photo) => {
    if (!currentWedding) return
    Alert.alert('Supprimer', 'Supprimer cette photo définitivement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/weddings/${currentWedding.id}/galerie/${photo.id}`)
            setSelectedPhoto(null)
            await fetchPhotos()
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer la photo.')
          }
        }
      },
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
        <Text style={styles.headerTitle}>📸 Galerie</Text>
        <TouchableOpacity
          style={[styles.toggleBtn, currentWedding.galerieOuverte && styles.toggleBtnActive]}
          onPress={handleToggleGalerie}
        >
          <Text style={styles.toggleBtnText}>
            {currentWedding.galerieOuverte ? '🟢 Ouverte' : '🔴 Fermée'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statVal}>{photos.length}</Text>
          <Text style={styles.statLbl}>Photos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: COLORS.success }]}>
            {photos.filter(p => p.validee).length}
          </Text>
          <Text style={styles.statLbl}>Visibles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statVal, { color: COLORS.muted }]}>
            {photos.filter(p => !p.validee).length}
          </Text>
          <Text style={styles.statLbl}>Masquées</Text>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnQR, !currentWedding.galerieOuverte && styles.actionBtnDisabled]}
          onPress={() => currentWedding.galerieOuverte && setShowQR(true)}
        >
          <Text style={styles.actionBtnIcon}>⬛</Text>
          <Text style={styles.actionBtnTextQR}>QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, !currentWedding.galerieOuverte && styles.actionBtnDisabled]}
          onPress={() => currentWedding.galerieOuverte && handleShareLink()}
        >
          <Text style={styles.actionBtnIcon}>📤</Text>
          <Text style={styles.actionBtnText}>Partager</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, uploading && styles.actionBtnDisabled]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading
            ? <ActivityIndicator color={COLORS.primary} size="small" />
            : <>
                <Text style={styles.actionBtnIcon}>➕</Text>
                <Text style={styles.actionBtnText}>Ma photo</Text>
              </>
          }
        </TouchableOpacity>
      </View>

      {/* Barre de progression upload */}
      {uploading && uploadProgress !== '' && (
        <View style={styles.uploadBar}>
          <ActivityIndicator color={COLORS.accent} size="small" />
          <Text style={styles.uploadBarText}>{uploadProgress}</Text>
        </View>
      )}

      {/* Grille photos */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accent]} />
        }
      >
        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : !currentWedding.galerieOuverte && photos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyTitle}>Galerie fermée</Text>
            <Text style={styles.emptyText}>
              Ouvrez la galerie pour que vos invités puissent scanner le QR Code et partager leurs photos.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleToggleGalerie}>
              <Text style={styles.emptyBtnText}>🎉 Ouvrir la galerie</Text>
            </TouchableOpacity>
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🖼️</Text>
            <Text style={styles.emptyTitle}>Aucune photo</Text>
            <Text style={styles.emptyText}>
              Montrez le QR Code à vos invités pour qu'ils partagent leurs photos.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, !currentWedding.galerieOuverte && { opacity: 0.5 }]}
              onPress={() => currentWedding.galerieOuverte && setShowQR(true)}
            >
              <Text style={styles.emptyBtnText}>⬛ Afficher le QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {photos.map(photo => (
              <TouchableOpacity
                key={photo.id}
                style={[styles.photoCell, !photo.validee && styles.photoCellHidden]}
                onPress={() => setSelectedPhoto(photo)}
              >
                <Image
                  source={{ uri: photo.thumbnailUrl || photo.url }}
                  style={styles.photoThumb}
                  resizeMode="cover"
                />
                {!photo.validee && (
                  <View style={styles.hiddenOverlay}>
                    <Text style={styles.hiddenText}>Masquée</Text>
                  </View>
                )}
                {photo.uploadePar && (
                  <View style={styles.uploaderTag}>
                    <Text style={styles.uploaderText}>{photo.uploadePar[0]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODAL QR CODE PLEIN ÉCRAN */}
      <Modal visible={showQR} animationType="fade" statusBarTranslucent>
        <View style={styles.qrModal}>
          <TouchableOpacity style={styles.qrClose} onPress={() => setShowQR(false)}>
            <Text style={styles.qrCloseText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.qrContent}>
            <Text style={styles.qrTitle}>💍 {currentWedding.nomCeremonie}</Text>
            <Text style={styles.qrSubtitle}>
              Scannez ce QR Code pour accéder à la galerie photo et partager vos souvenirs
            </Text>

            <View style={styles.qrCard}>
              <QRCode
                value={galerieUrl}
                size={220}
                color={COLORS.primary}
                backgroundColor={COLORS.white}
                logoSize={36}
                logoBackgroundColor={COLORS.white}
                logoBorderRadius={8}
              />
            </View>

            <View style={styles.qrUrlBox}>
              <Text style={styles.qrUrlLabel}>Lien direct :</Text>
              <Text style={styles.qrUrlText} numberOfLines={1} ellipsizeMode="middle">
                {galerieUrl}
              </Text>
            </View>

            <View style={styles.qrSteps}>
              {[
                'Ouvrez l\'appareil photo de votre téléphone',
                'Pointez vers ce QR Code',
                'Accédez à la galerie et partagez vos photos !',
              ].map((step, i) => (
                <View key={i} style={styles.qrStep}>
                  <View style={styles.qrStepNum}>
                    <Text style={styles.qrStepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.qrStepText}>{step}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.qrShareBtn} onPress={handleShareLink}>
              <Text style={styles.qrShareBtnText}>📤 Partager le lien par WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal photo détail */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={styles.photoModal}>
          <TouchableOpacity style={styles.photoModalClose} onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.photoModalCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.url }}
                style={styles.photoFull}
                resizeMode="contain"
              />
              <View style={styles.photoActions}>
                {selectedPhoto.caption && (
                  <Text style={styles.photoCaption}>{selectedPhoto.caption}</Text>
                )}
                {selectedPhoto.uploadePar && (
                  <Text style={styles.photoUploader}>Par {selectedPhoto.uploadePar}</Text>
                )}
                <View style={styles.photoButtons}>
                  <TouchableOpacity
                    style={[styles.photoBtn, { backgroundColor: selectedPhoto.validee ? COLORS.muted : COLORS.success }]}
                    onPress={() => handleModerer(selectedPhoto)}
                  >
                    <Text style={styles.photoBtnText}>
                      {selectedPhoto.validee ? '🙈 Masquer' : '👁️ Afficher'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.photoBtn, { backgroundColor: COLORS.danger }]}
                    onPress={() => handleDeletePhoto(selectedPhoto)}
                  >
                    <Text style={styles.photoBtnText}>🗑️ Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Modal caption + confirmation upload */}
      <Modal visible={showCaption} transparent animationType="slide">
        <View style={styles.captionModal}>
          <View style={styles.captionCard}>
            <Text style={styles.captionTitle}>📸 Ajouter une légende</Text>
            {pendingUri && (
              <Image
                source={{ uri: pendingUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <TextInput
              style={styles.captionInput}
              placeholder="Ex: Belle cérémonie ! (optionnel)"
              placeholderTextColor={COLORS.muted}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={200}
            />
            <View style={styles.captionButtons}>
              <TouchableOpacity style={styles.captionCancel} onPress={handleCancelCaption}>
                <Text style={styles.captionCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captionSave} onPress={handleUpload}>
                <Text style={styles.captionSaveText}>Uploader sur Supabase</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  toggleBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  toggleBtnActive: { backgroundColor: 'rgba(56,161,105,0.3)' },
  toggleBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '600' },

  statsBar: { backgroundColor: COLORS.white, flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  statLbl: { fontSize: 10, color: COLORS.muted, marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 10, padding: 14 },
  actionBtn: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border },
  actionBtnQR: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnIcon: { fontSize: 18, marginBottom: 4 },
  actionBtnText: { fontSize: 11, color: COLORS.text, fontWeight: '500' },
  actionBtnTextQR: { fontSize: 11, color: COLORS.white, fontWeight: '600' },

  uploadBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primary + '15', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  uploadBarText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  photoCell: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 10, overflow: 'hidden' },
  photoCellHidden: { opacity: 0.5 },
  photoThumb: { width: '100%', height: '100%' },
  hiddenOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  hiddenText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  uploaderTag: { position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  uploaderText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  qrModal: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrClose: { position: 'absolute', top: 56, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  qrCloseText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  qrContent: { alignItems: 'center', width: '100%' },
  qrTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white, textAlign: 'center', marginBottom: 8 },
  qrSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 16 },
  qrCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  qrUrlBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 24 },
  qrUrlLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  qrUrlText: { fontSize: 12, color: COLORS.accent, fontWeight: '600' },
  qrSteps: { width: '100%', marginBottom: 24 },
  qrStep: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  qrStepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  qrStepNumText: { color: COLORS.primary, fontSize: 13, fontWeight: '800' },
  qrStepText: { fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1, lineHeight: 18 },
  qrShareBtn: { backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  qrShareBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },

  photoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' },
  photoModalClose: { position: 'absolute', top: 56, right: 20, zIndex: 10, padding: 8 },
  photoModalCloseText: { color: COLORS.white, fontSize: 24 },
  photoFull: { width: '100%', height: '60%' },
  photoActions: { padding: 20 },
  photoCaption: { color: COLORS.white, fontSize: 15, marginBottom: 4, textAlign: 'center' },
  photoUploader: { color: COLORS.muted, fontSize: 13, marginBottom: 16, textAlign: 'center' },
  photoButtons: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  photoBtn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  photoBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  captionModal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  captionCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  captionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 14, textAlign: 'center' },
  previewImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 14 },
  captionInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, backgroundColor: COLORS.gray, minHeight: 70, textAlignVertical: 'top', marginBottom: 16 },
  captionButtons: { flexDirection: 'row', gap: 12 },
  captionCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  captionCancelText: { color: COLORS.muted, fontWeight: '600' },
  captionSave: { flex: 2, padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  captionSaveText: { color: COLORS.white, fontWeight: '700' },
})


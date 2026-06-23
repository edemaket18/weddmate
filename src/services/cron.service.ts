import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { sendWhatsAppMessage, buildMessage } from './whatsapp.service'

const prisma = new PrismaClient()

export const startCronJobs = () => {
  // Tous les jours à minuit
  cron.schedule('0 0 * * *', async () => {
    console.log('🔔 Cron rappels — démarrage', new Date().toISOString())
    await processRappels()
  })

  console.log('⏰ Cron jobs démarrés')
}

const processRappels = async () => {
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  // Récupérer tous les rappels programmés dus aujourd'hui
  const rappels = await prisma.rappel.findMany({
    where: {
      statut: 'PROGRAMME',
      dateEnvoi: { lte: endOfDay },
    },
    include: {
      wedding: true,
      weddingPrestataire: { include: { prestataire: true } },
    },
  })

  console.log(`📨 ${rappels.length} rappel(s) à envoyer`)

  for (const rappel of rappels) {
    try {
      const message = buildMessage(rappel.type, {
        nomCeremonie: rappel.wedding.nomCeremonie,
        dateJourJ: rappel.wedding.dateJourJ,
        lieuCeremonie: rappel.wedding.lieuCeremonie,
        lieuReception: rappel.wedding.lieuReception,
        nomPrestataire: rappel.weddingPrestataire?.prestataire.nomEntreprise,
        devise: rappel.wedding.devise,
      })

      await sendWhatsAppMessage({
        to: rappel.destinataire,
        message: rappel.messagePersonna || message,
      })

      // Marquer comme envoyé
      await prisma.rappel.update({
        where: { id: rappel.id },
        data: { statut: 'ENVOYE' },
      })

      // Si c'est un rappel invité J-7, marquer l'invité
      if (rappel.type === 'RSVP_INVITE_J7') {
        await prisma.invite.updateMany({
          where: {
            weddingId: rappel.weddingId,
            whatsapp: rappel.destinataire,
            statut: 'CONFIRME',
          },
          data: { rappelJ7Envoye: true },
        })
      }

      console.log(`✅ Rappel envoyé → ${rappel.destinataire} (${rappel.type})`)
    } catch (error: any) {
      console.error(`❌ Echec rappel ${rappel.id}:`, error.message)

      await prisma.rappel.update({
        where: { id: rappel.id },
        data: {
          statut: 'ECHEC',
          erreurMessage: error.message?.slice(0, 255),
        },
      })
    }
  }
}
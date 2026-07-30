-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COUPLE', 'PRESTATAIRE', 'PLANNER', 'ADMIN');

-- CreateEnum
CREATE TYPE "WeddingStatus" AS ENUM ('EN_PREPARATION', 'CONFIRME', 'TERMINE', 'ANNULE');

-- CreateEnum
CREATE TYPE "PrestaireStatut" AS ENUM ('CONTACTE', 'EN_ATTENTE', 'CONFIRME', 'PAYE', 'ANNULE');

-- CreateEnum
CREATE TYPE "PrestaireCategorie" AS ENUM ('LIEU', 'TRAITEUR', 'PHOTOGRAPHE', 'VIDEASTE', 'DJ_MUSIQUE', 'ORCHESTRE', 'FLEURISTE', 'DECORATION', 'OFFICIANT', 'COIFFURE_MAQUILLAGE', 'TRANSPORT', 'GATEAU', 'ANIMATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "BudgetStatut" AS ENUM ('PREVU', 'ACOMPTE', 'SOLDE');

-- CreateEnum
CREATE TYPE "InviteStatut" AS ENUM ('EN_ATTENTE', 'CONFIRME', 'DECLINE', 'LISTE_ATTENTE');

-- CreateEnum
CREATE TYPE "RappelType" AS ENUM ('ACOMPTE_DU', 'SOLDE_DU', 'CONFIRMATION', 'DOCUMENTS', 'JOUR_J_MOINS_30', 'JOUR_J_MOINS_7', 'JOUR_J_MOINS_1', 'RSVP_INVITE_J7', 'PERSONNALISE');

-- CreateEnum
CREATE TYPE "RappelStatut" AS ENUM ('PROGRAMME', 'ENVOYE', 'ECHEC');

-- CreateEnum
CREATE TYPE "NotifCanal" AS ENUM ('WHATSAPP', 'EMAIL', 'SMS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "motDePasse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COUPLE',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weddings" (
    "id" TEXT NOT NULL,
    "nomCeremonie" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "dateJourJ" TIMESTAMP(3) NOT NULL,
    "heureCeremonie" TEXT,
    "heureReception" TEXT,
    "lieuCeremonie" TEXT,
    "lieuReception" TEXT,
    "statut" "WeddingStatus" NOT NULL DEFAULT 'EN_PREPARATION',
    "budgetTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL DEFAULT 'FCFA',
    "nombreInvites" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "rsvpOuvert" BOOLEAN NOT NULL DEFAULT false,
    "galerieOuverte" BOOLEAN NOT NULL DEFAULT false,
    "rsvpDateLimite" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plannerId" TEXT,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_couples" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MARIE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_couples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestataires" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "nomEntreprise" TEXT NOT NULL,
    "nomContact" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "whatsapp" TEXT,
    "categorie" "PrestaireCategorie" NOT NULL,
    "description" TEXT,
    "siteWeb" TEXT,
    "ville" TEXT,
    "noteGlobale" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestataires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_prestataires" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "statut" "PrestaireStatut" NOT NULL DEFAULT 'CONTACTE',
    "montantDevis" DOUBLE PRECISION,
    "montantAcompte" DOUBLE PRECISION,
    "dateAcompte" TIMESTAMP(3),
    "montantSolde" DOUBLE PRECISION,
    "dateSolde" TIMESTAMP(3),
    "heureArrivee" TIMESTAMP(3),
    "heureDepart" TIMESTAMP(3),
    "lieuIntervention" TEXT,
    "notesContrat" TEXT,
    "ficheConfirmee" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_prestataires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_items" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "categorie" "PrestaireCategorie" NOT NULL,
    "libelle" TEXT NOT NULL,
    "montantPrevu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "montantPaye" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" "BudgetStatut" NOT NULL DEFAULT 'PREVU',
    "datePaiement" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "whatsapp" TEXT,
    "statut" "InviteStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "nombreAccompa" INTEGER NOT NULL DEFAULT 0,
    "tableAssignee" TEXT,
    "regimeAliment" TEXT,
    "transport" BOOLEAN NOT NULL DEFAULT false,
    "hebergement" BOOLEAN NOT NULL DEFAULT false,
    "cote" TEXT,
    "notes" TEXT,
    "messageAuxMaries" TEXT,
    "rsvpAt" TIMESTAMP(3),
    "rsvpSource" TEXT,
    "rappelJ7Envoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "echeance" TIMESTAMP(3),
    "faite" BOOLEAN NOT NULL DEFAULT false,
    "priorite" INTEGER NOT NULL DEFAULT 2,
    "categorie" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rappels" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "weddingPrestataireId" TEXT,
    "type" "RappelType" NOT NULL,
    "canal" "NotifCanal" NOT NULL DEFAULT 'WHATSAPP',
    "destinataire" TEXT NOT NULL,
    "messagePersonna" TEXT,
    "dateEnvoi" TIMESTAMP(3) NOT NULL,
    "statut" "RappelStatut" NOT NULL DEFAULT 'PROGRAMME',
    "erreurMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rappels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "taille" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" TEXT NOT NULL,
    "prestataireId" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "note" INTEGER NOT NULL,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos_galerie" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "taille" INTEGER,
    "uploadePar" TEXT,
    "whatsappUpl" TEXT,
    "validee" BOOLEAN NOT NULL DEFAULT true,
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_galerie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weddingId" TEXT,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "lien" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "users"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_couples_weddingId_userId_key" ON "wedding_couples"("weddingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "prestataires_userId_key" ON "prestataires"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_prestataires_weddingId_prestataireId_key" ON "wedding_prestataires"("weddingId", "prestataireId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_prestataireId_weddingId_key" ON "evaluations"("prestataireId", "weddingId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weddings" ADD CONSTRAINT "weddings_plannerId_fkey" FOREIGN KEY ("plannerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_couples" ADD CONSTRAINT "wedding_couples_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_couples" ADD CONSTRAINT "wedding_couples_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestataires" ADD CONSTRAINT "prestataires_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_prestataires" ADD CONSTRAINT "wedding_prestataires_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_prestataires" ADD CONSTRAINT "wedding_prestataires_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rappels" ADD CONSTRAINT "rappels_weddingPrestataireId_fkey" FOREIGN KEY ("weddingPrestataireId") REFERENCES "wedding_prestataires"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "prestataires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos_galerie" ADD CONSTRAINT "photos_galerie_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

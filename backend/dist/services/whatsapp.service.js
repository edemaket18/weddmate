"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMessage = exports.sendWhatsAppMessage = void 0;
const axios_1 = __importDefault(require("axios"));
const WA_TOKEN = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_URL = `https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`;
const sendWhatsAppMessage = async ({ to, message }) => {
    const phone = to.startsWith('+') ? to.slice(1) : to;
    const response = await axios_1.default.post(WA_URL, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phone,
        type: 'text',
        text: { preview_url: false, body: message },
    }, {
        headers: {
            Authorization: `Bearer ${WA_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};
exports.sendWhatsAppMessage = sendWhatsAppMessage;
// Templates de messages par type de rappel
const buildMessage = (type, data) => {
    const date = new Date(data.dateJourJ).toLocaleDateString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    switch (type) {
        case 'JOUR_J_MOINS_30':
            return `💍 *WeddMate* — Rappel mariage\n\nBonjour,\n\nLe mariage *${data.nomCeremonie}* aura lieu dans *30 jours*, le ${date}.\n\n📍 Lieu : ${data.lieuCeremonie || 'À confirmer'}\n\nMerci de confirmer votre disponibilité et vos horaires d\'intervention.`;
        case 'JOUR_J_MOINS_7':
            return `💍 *WeddMate* — J-7 !\n\nBonjour,\n\nPlus que *7 jours* avant le mariage *${data.nomCeremonie}* le ${date}.\n\n📍 Cérémonie : ${data.lieuCeremonie || 'À confirmer'}\n🍽️ Réception : ${data.lieuReception || 'À confirmer'}\n\nMerci de confirmer vos horaires d\'arrivée et de vous assurer que tout est prêt !`;
        case 'JOUR_J_MOINS_1':
            return `💍 *WeddMate* — C'est demain !\n\nBonjour,\n\nLe grand jour est *demain* ! Mariage *${data.nomCeremonie}* le ${date}.\n\n📍 Lieu : ${data.lieuCeremonie || 'À confirmer'}\n\nNous comptons sur vous. Bonne préparation ! 🎊`;
        case 'ACOMPTE_DU':
            return `💍 *WeddMate* — Rappel acompte\n\nBonjour,\n\nNous vous rappelons que l\'acompte de *${data.montant?.toLocaleString()} ${data.devise || 'FCFA'}* pour le mariage *${data.nomCeremonie}* est attendu.\n\nMerci de nous contacter pour finaliser le paiement.`;
        case 'SOLDE_DU':
            return `💍 *WeddMate* — Rappel solde\n\nBonjour,\n\nLe solde de *${data.montant?.toLocaleString()} ${data.devise || 'FCFA'}* pour le mariage *${data.nomCeremonie}* est attendu.\n\nMerci de nous contacter pour finaliser le paiement.`;
        case 'RSVP_INVITE_J7':
            return `💍 *${data.nomCeremonie}*\n\nBonjour ! Le mariage auquel vous avez confirmé votre présence a lieu dans *7 jours*, le ${date}.\n\n📍 Cérémonie : ${data.lieuCeremonie || 'À confirmer'}\n🍽️ Réception : ${data.lieuReception || 'À confirmer'}\n\nNous avons hâte de vous voir ! 🎊`;
        case 'CONFIRMATION':
            return `💍 *WeddMate* — Demande de confirmation\n\nBonjour,\n\nPouvez-vous confirmer votre intervention pour le mariage *${data.nomCeremonie}* le ${date} ?\n\nMerci de répondre à ce message pour valider votre participation.`;
        default:
            return `💍 *WeddMate* — Rappel mariage *${data.nomCeremonie}* le ${date}.`;
    }
};
exports.buildMessage = buildMessage;
//# sourceMappingURL=whatsapp.service.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndStoreQRCode = generateAndStoreQRCode;
const qrcode_1 = __importDefault(require("qrcode"));
const supabase_service_1 = require("./supabase.service");
async function generateAndStoreQRCode(weddingId, invitationUrl) {
    const qrBase64 = await qrcode_1.default.toDataURL(invitationUrl);
    const base64 = qrBase64.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    const fileName = `wedding-${weddingId}.png`;
    const { error } = await supabase_service_1.supabase.storage
        .from(supabase_service_1.BUCKET_QR)
        .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
    });
    if (error) {
        throw error;
    }
    const { data } = supabase_service_1.supabase.storage
        .from(supabase_service_1.BUCKET_QR)
        .getPublicUrl(fileName);
    return data.publicUrl;
}
//# sourceMappingURL=qrcode.service.js.map
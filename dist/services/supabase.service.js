"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadPhoto = exports.supabase = exports.BUCKET_QR = exports.BUCKET_PHOTOS = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const requireEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Variable d'environnement manquante: ${key}`);
    }
    return value;
};
exports.BUCKET_PHOTOS = process.env.BUCKET_NAME || 'weddmate-photos';
exports.BUCKET_QR = process.env.BUCKET_QR || 'weddmate-qrcodes';
exports.supabase = (0, supabase_js_1.createClient)(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_KEY'));
const uploadPhoto = async (file, path) => {
    const { error } = await exports.supabase.storage
        .from(exports.BUCKET_PHOTOS)
        .upload(path, file, { contentType: 'image/jpeg' });
    if (error)
        throw error;
    return exports.supabase.storage.from(exports.BUCKET_PHOTOS).getPublicUrl(path).data.publicUrl;
};
exports.uploadPhoto = uploadPhoto;
//# sourceMappingURL=supabase.service.js.map
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Charge le compte de service depuis l'env FIREBASE_SERVICE_ACCOUNT.
// Accepte soit le JSON brut, soit sa version base64 (recommandé pour éviter
// les soucis de retours à la ligne de la private_key dans les env vars).
function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  try {
    const trimmed = raw.trim();
    const json = trimmed.startsWith('{') ? trimmed : Buffer.from(trimmed, 'base64').toString('utf-8');
    const sa = JSON.parse(json);
    if (sa.private_key && sa.private_key.includes('\\n')) {
      sa.private_key = sa.private_key.replace(/\\n/g, '\n');
    }
    return sa;
  } catch (err) {
    console.error('[firebase-admin] FIREBASE_SERVICE_ACCOUNT invalide:', err.message);
    return null;
  }
}

// adminDb reste null si le compte de service n'est pas configuré ; la route
// /api/contact gère ce cas proprement (503) plutôt que de crasher au chargement.
let adminDb = null;
const serviceAccount = loadServiceAccount();
if (serviceAccount) {
  const app = getApps().length ? getApps()[0] : initializeApp({ credential: cert(serviceAccount) });
  adminDb = getFirestore(app);
}

export { adminDb };

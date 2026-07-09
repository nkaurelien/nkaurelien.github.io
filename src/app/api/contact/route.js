import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const HCAPTCHA_ENABLED = process.env.NEXT_PUBLIC_HCAPTCHA_ENABLED !== 'false';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const clip = (value, max) =>
  String(value ?? '')
    .trim()
    .slice(0, max);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Vérifie le token hCaptcha côté serveur (siteverify) avec le secret privé.
async function verifyHcaptcha(token, remoteip) {
  const secret = process.env.HCAPTCHA_SECRET;
  if (!secret) {
    console.error('[contact] HCAPTCHA_SECRET manquant côté serveur.');
    return false;
  }
  const params = new URLSearchParams({ secret, response: token });
  if (remoteip) params.set('remoteip', remoteip);

  const res = await fetch('https://api.hcaptcha.com/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.success) console.warn('[contact] hCaptcha refusé:', data['error-codes']);
  return !!data.success;
}

export async function POST(req) {
  try {
    const { name, email, message, token } = await req.json();

    // Validation basique
    const cleanName = clip(name, 120);
    const cleanEmail = clip(email, 200);
    const cleanMessage = clip(message, 5000);
    if (!cleanName || !cleanMessage || !isEmail(cleanEmail)) {
      return json({ error: 'Champs invalides (nom, email valide et message requis).' }, 400);
    }

    // Vérification hCaptcha côté serveur (si activé)
    if (HCAPTCHA_ENABLED) {
      if (!token) return json({ error: 'Vérification captcha requise.' }, 400);
      const remoteip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
      const ok = await verifyHcaptcha(token, remoteip);
      if (!ok) return json({ error: 'Échec de la vérification captcha.' }, 400);
    }

    // Écriture côté serveur uniquement (admin SDK) — les rules interdisent l'écriture client.
    if (!adminDb) {
      console.error('[contact] adminDb indisponible (FIREBASE_SERVICE_ACCOUNT non configuré).');
      return json({ error: 'Service de contact momentanément indisponible.' }, 503);
    }

    await adminDb.collection('messages').add({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
      source: 'contact-form',
    });

    return json({ ok: true });
  } catch (err) {
    console.error('[contact] erreur:', err);
    return json({ error: 'Erreur serveur.' }, 500);
  }
}

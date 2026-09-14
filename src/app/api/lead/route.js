import { adminDb } from '@/lib/firebase-admin';
import { sendNtfyNotification, sendUmamiServerEvent } from '@/lib/notifications';

export const runtime = 'nodejs';

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

const clip = (value, max) =>
  String(value ?? '')
    .trim()
    .slice(0, max);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req) {
  try {
    const { email, name = '', company = '', cvId = 'cv' } = await req.json();

    const cleanEmail = clip(email, 200);
    const cleanName = clip(name, 120);
    const cleanCompany = clip(company, 150);
    const cleanCvId = clip(cvId, 50);

    if (!isEmail(cleanEmail)) {
      return json({ error: 'Une adresse email valide est requise.' }, 400);
    }

    if (adminDb) {
      await adminDb.collection('leads').add({
        email: cleanEmail,
        name: cleanName,
        company: cleanCompany,
        cvId: cleanCvId,
        createdAt: new Date().toISOString(),
        source: 'cv-download-gate',
      });
    } else {
      console.warn('[lead-api] adminDb non configuré, enregistrement silencieux.');
    }

    // Notifications serveur (ntfy push + Umami SSE)
    Promise.allSettled([
      sendNtfyNotification({
        title: `📄 Téléchargement CV (${cleanCvId})`,
        message: `Email : ${cleanEmail}\nNom : ${cleanName || 'N/C'}\nEntreprise : ${cleanCompany || 'N/C'}`,
        priority: 'default',
        tags: ['file_folder', 'cv_download'],
      }),
      sendUmamiServerEvent({
        name: 'cv_download',
        url: `/cv/${cleanCvId}`,
        data: { email: cleanEmail, cvId: cleanCvId, company: cleanCompany },
      }),
    ]);

    return json({ ok: true });
  } catch (err) {
    console.error('[lead-api] Erreur enregistrement lead:', err);
    return json({ ok: true }); // Ne pas bloquer l'utilisateur même en cas d'erreur DB
  }
}

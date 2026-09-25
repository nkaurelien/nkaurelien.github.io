import { adminDb } from '@/lib/firebase-admin';
import { sendNtfyNotification, sendUmamiServerEvent } from '@/lib/notifications';

export const runtime = 'nodejs';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const clip = (value, max) =>
  String(value ?? '')
    .trim()
    .slice(0, max);
const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req) {
  try {
    const {
      email = '',
      name = '',
      company = '',
      cvId = 'cv',
      cvTitle = '',
      source = 'cv-download',
    } = await req.json();

    const cleanEmail = clip(email, 200);
    const cleanName = clip(name, 120);
    const cleanCompany = clip(company, 150);
    const cleanCvId = clip(cvId, 50);
    const cleanCvTitle = clip(cvTitle, 100);
    const cleanSource = clip(source, 60);

    const hasValidEmail = isEmail(cleanEmail);

    // 1. Enregistrement Firestore si email valide (formulaire lead)
    if (hasValidEmail && adminDb) {
      try {
        await adminDb.collection('leads').add({
          email: cleanEmail,
          name: cleanName,
          company: cleanCompany,
          cvId: cleanCvId,
          cvTitle: cleanCvTitle,
          source: cleanSource,
          createdAt: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.warn('[lead-api] Erreur Firestore leads:', dbErr?.message);
      }
    }

    // 2. Formatage de la notification Ntfy selon la provenance
    let ntfyTitle = '';
    let ntfyMessage = '';
    let ntfyTags = [];
    let priority = 'default';

    if (hasValidEmail) {
      // Téléchargement après soumission du formulaire lead
      ntfyTitle = `📄 CV Téléchargé : ${cleanName || cleanEmail} (${cleanCvId})`;
      ntfyMessage = [
        `👤 Nom : ${cleanName || 'N/C'}`,
        `📧 Email : ${cleanEmail}`,
        `🏢 Entreprise : ${cleanCompany || 'N/C'}`,
        `📂 CV : ${cleanCvTitle || cleanCvId}`,
        `🌐 Source : ${cleanSource}`,
      ].join('\n');
      ntfyTags = ['file_folder', 'briefcase', 'email'];
      priority = 'high';
    } else {
      // Téléchargement direct (bouton flottant ou consultation directe)
      ntfyTitle = `📥 Téléchargement Direct CV (${cleanCvId})`;
      ntfyMessage = [
        `Un visiteur a téléchargé directement le CV : ${cleanCvTitle || cleanCvId}`,
        `📂 Fichier : ${cleanCvId}.pdf`,
        `🌐 Source : ${cleanSource}`,
      ].join('\n');
      ntfyTags = ['inbox_tray', 'page_facing_up'];
      priority = 'default';
    }

    // 3. Envoi asynchrone push Ntfy + Umami SSE
    Promise.allSettled([
      sendNtfyNotification({
        title: ntfyTitle,
        message: ntfyMessage,
        priority,
        tags: ntfyTags,
        click: 'https://nkaurelien.kamitbrains.fr/cv.pdf',
      }),
      sendUmamiServerEvent({
        name: 'cv_download',
        url: `/cv/${cleanCvId}`,
        data: {
          email: cleanEmail || undefined,
          cvId: cleanCvId,
          cvTitle: cleanCvTitle,
          source: cleanSource,
        },
      }),
    ]);

    return json({ ok: true });
  } catch (err) {
    console.error('[lead-api] Erreur traitement notification/lead:', err);
    return json({ ok: true }); // Ne jamais bloquer le téléchargement client
  }
}

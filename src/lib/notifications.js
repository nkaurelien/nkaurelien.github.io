/**
 * Service d'envoi de notifications instantanées (ntfy)
 * et d'événements serveur Umami (Server-Side Events).
 */

const UMAMI_URL = process.env.UMAMI_URL || 'https://umami.kamitbrains.fr';
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '37569a74-7d82-44fc-b839-525d4604c9b8';
const NTFY_TOPIC_URL = process.env.NTFY_TOPIC_URL; // ex: https://ntfy.sh/nkaurelien-notifications ou https://ntfy.kamitbrains.fr/portfolio

/**
 * Envoie une notification push instantanée vers un serveur ntfy.
 */
export async function sendNtfyNotification({ title, message, priority = 'default', tags = [] }) {
  if (!NTFY_TOPIC_URL) {
    console.log('[ntfy] Notification sautée (NTFY_TOPIC_URL non configuré).', { title, message });
    return false;
  }

  try {
    const res = await fetch(NTFY_TOPIC_URL, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: priority,
        Tags: tags.join(','),
        'Content-Type': 'text/plain; charset=utf-8',
      },
      body: message,
    });

    if (!res.ok) {
      console.warn('[ntfy] Erreur réponse ntfy:', res.status, res.statusText);
      return false;
    }

    console.log('[ntfy] Notification envoyée avec succès:', title);
    return true;
  } catch (err) {
    console.error('[ntfy] Erreur lors de l\'envoi:', err?.message || err);
    return false;
  }
}

/**
 * Envoie un événement serveur à l'API Umami (/api/send) selon la documentation Umami Server-Side Events.
 */
export async function sendUmamiServerEvent({ name, url = '/api', data = {}, hostname = 'nkaurelien.kamitbrains.fr' }) {
  try {
    const endpoint = `${UMAMI_URL.replace(/\/$/, '')}/api/send`;
    const payload = {
      type: 'event',
      payload: {
        website: UMAMI_WEBSITE_ID,
        hostname,
        url,
        name,
        data,
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'nkaurelien-website-server/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('[umami-sse] Erreur envoi événement serveur:', res.status);
      return false;
    }

    console.log('[umami-sse] Événement serveur enregistré:', name);
    return true;
  } catch (err) {
    console.error('[umami-sse] Erreur envoi événement:', err?.message || err);
    return false;
  }
}

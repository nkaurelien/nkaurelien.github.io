/**
 * Service d'envoi de notifications instantanées (ntfy)
 * et d'événements serveur Umami (Server-Side Events).
 */

const UMAMI_URL = (process.env.UMAMI_URL || process.env.UMAMI_SERVER_URL || 'https://umami.kamitbrains.fr').replace(/\/$/, '');
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || process.env.UMAMI_WEBSITE_ID || '37569a74-7d82-44fc-b839-525d4604c9b8';
/**
 * Résout l'URL complète du topic ntfy.
 * Priorité :
 * 1. NTFY_TOPIC_URL (ex: https://ntfy.kamitbrains.fr/alerts-kobavado-7890)
 * 2. NTFY_TOPIC combiné avec NTFY_SERVER_URL (par défaut: https://ntfy.kamitbrains.fr)
 */
export function getNtfyTopicUrl() {
  if (process.env.NTFY_TOPIC_URL) {
    return process.env.NTFY_TOPIC_URL.trim();
  }
  const topic = process.env.NTFY_TOPIC?.trim();
  if (!topic) return null;

  const server = (process.env.NTFY_SERVER_URL || process.env.NTFY_BASE_URL || 'https://ntfy.kamitbrains.fr').trim().replace(/\/+$/, '');
  return `${server}/${topic.replace(/^\/+/, '')}`;
}

const PRIORITY_MAP = {
  min: 1,
  low: 2,
  default: 3,
  high: 4,
  urgent: 5,
  max: 5,
};

function normalizeActions(actions) {
  if (!actions) return undefined;
  if (Array.isArray(actions)) return actions;
  if (typeof actions === 'string') {
    const parts = actions.split(',').map(s => s.trim());
    if (parts.length >= 3) {
      return [{ action: parts[0], label: parts[1], url: parts.slice(2).join(',') }];
    }
  }
  return undefined;
}

/**
 * Envoie une notification push instantanée vers un serveur ntfy.
 */
export async function sendNtfyNotification({ title, message, priority = 'default', tags = [], click, actions }) {
  const topicUrl = getNtfyTopicUrl();
  if (!topicUrl) {
    console.log('[ntfy] Notification sautée (NTFY_TOPIC ou NTFY_TOPIC_URL non configuré).', { title, message });
    return false;
  }

  try {
    const url = new URL(topicUrl);
    const topic = url.pathname.replace(/^\/+/, '');
    const serverUrl = `${url.protocol}//${url.host}`;

    const numPriority = typeof priority === 'number' ? priority : PRIORITY_MAP[priority] || 3;
    const parsedActions = normalizeActions(actions);

    const payload = {
      topic,
      title,
      message,
      priority: numPriority,
    };

    if (Array.isArray(tags) && tags.length > 0) payload.tags = tags;
    if (click) payload.click = click;
    if (parsedActions) payload.actions = parsedActions;

    const headers = {
      'Content-Type': 'application/json',
    };

    if (process.env.NTFY_TOKEN) {
      headers.Authorization = `Bearer ${process.env.NTFY_TOKEN.trim()}`;
    }

    const res = await fetch(serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      console.warn('[ntfy] Erreur réponse ntfy:', res.status, res.statusText);
      return false;
    }

    console.log('[ntfy] Notification envoyée avec succès vers topic', topic, ':', title);
    return true;
  } catch (err) {
    console.error("[ntfy] Erreur lors de l'envoi vers ntfy:", err?.message || err);
    return false;
  }
}

/**
 * Envoie un événement serveur à l'API Umami (/api/send) selon la documentation Umami Server-Side Events.
 */
export async function sendUmamiServerEvent({ name, url = '/api', data = {}, hostname = 'nkaurelien.kamitbrains.fr' }) {
  if (!UMAMI_URL || !UMAMI_WEBSITE_ID) {
    console.log('[umami-sse] Événement ignoré (UMAMI_URL ou UMAMI_WEBSITE_ID non configuré).');
    return false;
  }
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
      signal: AbortSignal.timeout(3000),
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

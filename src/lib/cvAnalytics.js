/**
 * Helper client pour tracker et notifier le téléchargement ou la consultation d'un CV
 * (Appel non bloquant via fetch keepalive vers /api/lead qui notifie Ntfy et Umami).
 */
export function trackAndNotifyCvDownload({
  cvId = 'cv',
  cvTitle = 'CV Principal',
  source = 'floating_button_direct',
  email = '',
  name = '',
  company = '',
} = {}) {
  if (typeof window === 'undefined') return;

  // Tracker Umami côté client
  try {
    window.umami?.track('cv_pdf_download', { cvId, cvTitle, source });
  } catch {
    // ignore
  }

  const storedEmail = email || localStorage.getItem('cv_lead_email') || '';

  // Envoi asynchrone non-bloquant vers /api/lead (déclenche Ntfy côté serveur)
  try {
    fetch('/api/lead', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cvId,
        cvTitle,
        source,
        email: storedEmail,
        name,
        company,
      }),
    }).catch(() => {});
  } catch {
    // ignore
  }
}

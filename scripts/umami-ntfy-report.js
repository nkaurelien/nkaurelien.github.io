require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

/**
 * Script d'automatisation des rapports Umami vers ntfy.
 * S'authentifie sur l'API Umami, récupère les statistiques (vues, visiteurs, événements),
 * et génère une synthèse transmise directement via notification push ntfy.
 */

const UMAMI_URL = (process.env.UMAMI_URL || 'https://umami.kamitbrains.fr').replace(/\/$/, '');
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '37569a74-7d82-44fc-b839-525d4604c9b8';
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || 'admin';
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD;
const NTFY_TOPIC_URL = process.env.NTFY_TOPIC_URL;

async function loginUmami() {
  if (!UMAMI_PASSWORD) {
    throw new Error('UMAMI_PASSWORD non configuré dans .env.local');
  }

  const res = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UMAMI_USERNAME, password: UMAMI_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Échec de connexion Umami API: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.token;
}

async function getStats(token, startAt, endAt) {
  const url = `${UMAMI_URL}/api/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Erreur récupération stats: ${res.status}`);
  }

  return res.json();
}

async function sendNtfyReport(reportText) {
  if (!NTFY_TOPIC_URL) {
    console.log('\n--- RAPPORT SYNTHÈSE (Console) ---');
    console.log(reportText);
    console.log('\n(Ajoutez NTFY_TOPIC_URL dans .env.local pour recevoir ce rapport sur votre téléphone)');
    return;
  }

  const res = await fetch(NTFY_TOPIC_URL, {
    method: 'POST',
    headers: {
      Title: '📊 Rapport Analytics Umami (nkaurelien.kamitbrains.fr)',
      Priority: 'default',
      Tags: 'bar_chart,chart_with_upwards_trend',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body: reportText,
  });

  if (res.ok) {
    console.log('✅ Rapport Umami envoyé avec succès vers ntfy !');
  } else {
    console.error('❌ Échec envoi ntfy:', res.status);
  }
}

async function run() {
  console.log('🚀 Démarrage du rapport automatisé Umami -> ntfy...');

  try {
    const token = await loginUmami();
    console.log('🔑 Authentification Umami réussie.');

    // Période : 7 derniers jours
    const endAt = Date.now();
    const startAt = endAt - 7 * 24 * 60 * 60 * 1000;

    const stats = await getStats(token, startAt, endAt);

    const reportText = [
      `📈 Bilan des 7 derniers jours :`,
      `• Pages vues : ${stats.pageviews?.value || 0}`,
      `• Visiteurs uniques : ${stats.visitors?.value || 0}`,
      `• Sessions : ${stats.visits?.value || 0}`,
      `• Temps moyen : ${Math.round((stats.totaltime?.value || 0) / (stats.visits?.value || 1))}s`,
      `• Taux de rebond : ${Math.round((stats.bounces?.value || 0) / (stats.visits?.value || 1) * 100)}%`,
    ].join('\n');

    await sendNtfyReport(reportText);
  } catch (err) {
    console.error('❌ Erreur exécution du rapport:', err.message);
  }
}

run();

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

/**
 * Script d'automatisation des rapports Umami vers ntfy.
 * S'authentifie sur l'API Umami v2, récupère les statistiques (vues, visiteurs, événements),
 * et génère une synthèse transmise directement via notification push ntfy.
 */

const UMAMI_URL = (process.env.UMAMI_URL || process.env.UMAMI_SERVER_URL || '').replace(/\/$/, '');
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || 'admin';
const NTFY_SERVER_URL = (process.env.NTFY_SERVER_URL || process.env.NTFY_BASE_URL || 'https://ntfy.kamitbrains.fr').replace(/\/+$/, '');
const NTFY_TOPIC = process.env.NTFY_TOPIC;
const NTFY_TOPIC_URL = process.env.NTFY_TOPIC_URL || (NTFY_TOPIC ? `${NTFY_SERVER_URL}/${NTFY_TOPIC.replace(/^\/+/, '')}` : null);

async function loginUmami() {
  if (!UMAMI_URL) {
    throw new Error('UMAMI_URL non configuré dans l\'environnement.');
  }
  if (!UMAMI_PASSWORD) {
    throw new Error('UMAMI_PASSWORD non configuré.');
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

async function getWebsites(token) {
  const res = await fetch(`${UMAMI_URL}/api/websites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Erreur récupération liste des sites: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : (data.data || []);
}

async function getStats(token, websiteId, startAt, endAt) {
  const url = `${UMAMI_URL}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Erreur récupération stats pour site ${websiteId}: ${res.status}`);
  }

  return res.json();
}

function extractVal(stat) {
  if (typeof stat === 'number') return stat;
  if (typeof stat === 'object' && stat !== null && 'value' in stat) return stat.value || 0;
  return Number(stat) || 0;
}

async function sendNtfyReport(reportText) {
  if (!NTFY_TOPIC_URL) {
    console.log('\n--- RAPPORT SYNTHÈSE (Console) ---');
    console.log(reportText);
    return;
  }

  const res = await fetch(NTFY_TOPIC_URL, {
    method: 'POST',
    headers: {
      Title: 'Rapport Analytics Umami (nkaurelien.kamitbrains.fr)',
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

    const websites = await getWebsites(token);
    console.log(`🌐 Nombre de sites trouvés: ${websites.length}`);

    // Période : 7 derniers jours
    const endAt = Date.now();
    const startAt = endAt - 7 * 24 * 60 * 60 * 1000;

    let reportLines = [`📈 Bilan des 7 derniers jours :`];

    for (const site of websites) {
      const rawStats = await getStats(token, site.id, startAt, endAt);
      
      const pageviews = extractVal(rawStats.pageviews);
      const visitors = extractVal(rawStats.visitors);
      const visits = extractVal(rawStats.visits);
      const bounces = extractVal(rawStats.bounces);
      const totaltime = extractVal(rawStats.totaltime);

      const avgTime = visits > 0 ? Math.round(totaltime / visits) : 0;
      const bounceRate = visits > 0 ? Math.round((bounces / visits) * 100) : 0;

      reportLines.push(
        `\n🌐 Site: ${site.name} (${site.domain})`,
        `• Pages vues : ${pageviews}`,
        `• Visiteurs uniques : ${visitors}`,
        `• Sessions : ${visits}`,
        `• Temps moyen : ${avgTime}s`,
        `• Taux de rebond : ${bounceRate}%`
      );
    }

    await sendNtfyReport(reportLines.join('\n'));
  } catch (err) {
    console.error('❌ Erreur exécution du rapport:', err.message);
    process.exit(1);
  }
}

run();

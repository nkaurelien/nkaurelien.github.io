import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const UMAMI_URL = (process.env.UMAMI_URL || process.env.UMAMI_SERVER_URL || 'https://umami.kamitbrains.fr').replace(/\/$/, '');
const UMAMI_USERNAME = process.env.UMAMI_USERNAME || 'admin';
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD;

function extractVal(stat: unknown): number {
  if (typeof stat === 'number') return stat;
  if (typeof stat === 'object' && stat !== null && 'value' in stat) {
    return Number((stat as { value: unknown }).value) || 0;
  }
  return Number(stat) || 0;
}

export interface AnalyticsSiteStats {
  id: string;
  name: string;
  domain: string;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  bounceRate: number;
  avgTimeSeconds: number;
}

export interface AnalyticsReport {
  period: string;
  startDate: string;
  endDate: string;
  sites: AnalyticsSiteStats[];
  summaryText: string;
}

export async function queryAnalyticsReport(period: 'daily' | 'weekly' = 'weekly'): Promise<AnalyticsReport> {
  if (!UMAMI_URL) {
    throw new Error('UMAMI_URL non configuré dans l\'environnement.');
  }
  if (!UMAMI_PASSWORD) {
    throw new Error('UMAMI_PASSWORD non configuré.');
  }

  // 1. Login
  const loginRes = await fetch(`${UMAMI_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: UMAMI_USERNAME, password: UMAMI_PASSWORD }),
  });

  if (!loginRes.ok) {
    throw new Error(`Échec de connexion Umami API: ${loginRes.status} ${loginRes.statusText}`);
  }

  const { token } = (await loginRes.json()) as { token: string };

  // 2. Fetch Websites
  const sitesRes = await fetch(`${UMAMI_URL}/api/websites`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!sitesRes.ok) {
    throw new Error(`Erreur récupération liste des sites Umami: ${sitesRes.status}`);
  }

  const rawSitesData = (await sitesRes.json()) as unknown;
  const websites = Array.isArray(rawSitesData)
    ? (rawSitesData as Array<{ id: string; name: string; domain: string }>)
    : ((rawSitesData as { data?: Array<{ id: string; name: string; domain: string }> }).data || []);

  const days = period === 'daily' ? 1 : 7;
  const periodLabel = days === 1 ? 'dernières 24h' : `${days} derniers jours`;
  const endAt = Date.now();
  const startAt = endAt - days * 24 * 60 * 60 * 1000;

  const sitesSummary: AnalyticsSiteStats[] = [];
  const textLines: string[] = [`📈 Rapport Analytics Umami (${periodLabel}) :`];

  for (const site of websites) {
    const statsRes = await fetch(`${UMAMI_URL}/api/websites/${site.id}/stats?startAt=${startAt}&endAt=${endAt}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!statsRes.ok) continue;

    const rawStats = (await statsRes.json()) as Record<string, unknown>;
    const pageviews = extractVal(rawStats.pageviews);
    const visitors = extractVal(rawStats.visitors);
    const visits = extractVal(rawStats.visits);
    const bounces = extractVal(rawStats.bounces);
    const totaltime = extractVal(rawStats.totaltime);

    const avgTime = visits > 0 ? Math.round(totaltime / visits) : 0;
    const bounceRate = visits > 0 ? Math.round((bounces / visits) * 100) : 0;

    sitesSummary.push({
      id: site.id,
      name: site.name,
      domain: site.domain,
      pageviews,
      visitors,
      visits,
      bounces,
      bounceRate,
      avgTimeSeconds: avgTime,
    });

    textLines.push(
      `\n🌐 Site : ${site.name} (${site.domain})`,
      `• Pages vues : ${pageviews}`,
      `• Visiteurs uniques : ${visitors}`,
      `• Visites (sessions) : ${visits}`,
      `• Taux de rebond : ${bounceRate}%`,
      `• Durée moyenne : ${avgTime}s`
    );
  }

  return {
    period: periodLabel,
    startDate: new Date(startAt).toISOString(),
    endDate: new Date(endAt).toISOString(),
    sites: sitesSummary,
    summaryText: textLines.join('\n'),
  };
}

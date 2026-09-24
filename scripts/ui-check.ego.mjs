// Vérification d'interface et d'accessibilité en vrai navigateur (ego lite), SANS appel LLM.
// Ne pas lancer directement : passer par scripts/ui-check.sh, qui remplace __BASE__, __OUT__
// et __AXE__ (ego-browser ne transmet pas les variables d'environnement au script).
//
// Sélecteurs : attributs data-testid et rôles ARIA posés dans les composants
// (skip-link, main-content, nav-*, blog-*, article-*, chat-*), stables même si le texte
// ou le style changent.
//
// Par page : exceptions JS et ressources du site en 4xx/5xx (échec), console.error
// (avertissement), audit axe-core WCAG 2.1 A/AA (serious/critical = échec,
// moderate/minor = avertissement), lien d'évitement au 1er Tab, un seul h1, main#content.

const BASE = '__BASE__';
const OUT = '__OUT__';
const AXE_PATH = '__AXE__';

const { readFile } = await import('node:fs/promises');
const AXE_SOURCE = await readFile(AXE_PATH, 'utf8');

const results = [];
const record = (name, ok, detail, level = ok ? 'ok' : 'fail') => results.push({ name, ok, detail, level });

const task = await taskSpace('ui-check site');
const page = task.page('p1');
await page.cdp('Runtime.enable');
await page.cdp('Network.enable');
// Les visites de test ne doivent pas fausser les statistiques Umami : on bloque l'envoi
// (le chargement de /stats/script.js reste vérifié).
await page.cdp('Network.setBlockedURLs', { urls: ['*/stats/api/send*'] });

const origin = new URL(BASE).origin;
const count = selector => page.evaluate(sel => document.querySelectorAll(sel).length, selector);

// Charge une page et renvoie ses problèmes : exceptions, erreurs console, ressources du site en erreur.
async function visit(url) {
  await page.events(); // vide le tampon
  await page.goto(url);
  await page.waitForLoadState();
  await page.waitForTimeout(1500); // hydratation React et scripts différés
  const ev = await page.events();
  // Exceptions du site uniquement (ego lite injecte sa messagerie : « No Listener: tabs:… »).
  const exceptions = ev
    .filter(e => e.method === 'Runtime.exceptionThrown')
    .map(e => e.params.exceptionDetails)
    .filter(d => {
      const src = d.url || d.stackTrace?.callFrames?.[0]?.url || '';
      const msg = d.exception?.description || d.text || '';
      return !src.startsWith('chrome-extension://') && !/No Listener: tabs:/.test(msg);
    })
    .map(d => (d.exception?.description || d.text || '').split('\n')[0]);
  const consoleErrors = ev
    .filter(e => e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error')
    .map(e =>
      e.params.args
        .map(a => a.value ?? a.description ?? '')
        .join(' ')
        .slice(0, 120)
    );
  const failedAll = ev
    .filter(e => e.method === 'Network.responseReceived' && e.params.response.status >= 400)
    .map(e => `${e.params.response.status} ${e.params.response.url}`)
    .filter(s => s.includes(origin));
  // Analytics Umami (proxy /stats/) : non configuré en local, et suivi par un test HTTP dédié.
  const analytics = failedAll.filter(s => s.includes('/stats/'));
  const failed = failedAll.filter(s => !s.includes('/stats/'));
  return { exceptions, consoleErrors, failed, analytics };
}

// Audit axe-core : injecté dans la page, règles WCAG 2.1 A/AA.
async function axeAudit() {
  await page.evaluate(`${AXE_SOURCE}; 0`);
  return page.evaluate(() =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }).then(r =>
      r.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        target: v.nodes[0]?.target?.join(' ') || '',
      }))
    )
  );
}

// Structure commune : main#content, un seul h1, lang, lien d'évitement atteint au 1er Tab.
async function structure() {
  const s = await page.evaluate(() => ({
    main: !!document.querySelector('main#content'),
    h1: document.querySelectorAll('h1').length,
    lang: document.documentElement.lang,
  }));
  // Replace le point de départ de la tabulation au début du document : un simple blur()
  // le laisse sur le dernier élément focalisé (ex. un tag cliqué juste avant).
  await page.evaluate(() => {
    const body = document.body;
    body.setAttribute('tabindex', '-1');
    body.focus({ preventScroll: true });
    body.removeAttribute('tabindex');
    window.scrollTo(0, 0);
  });
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') || document.activeElement?.tagName);
  const problems = [];
  if (!s.main) problems.push('pas de main#content');
  if (s.h1 !== 1) problems.push(`${s.h1} h1 (attendu 1)`);
  if (!s.lang) problems.push('html sans lang');
  if (firstFocus !== 'skip-link') problems.push(`1er Tab sur « ${firstFocus} » au lieu du lien d'évitement`);
  return problems;
}

async function checkPage(name, path, extra) {
  const url = BASE + path;
  try {
    const { exceptions, consoleErrors, failed, analytics } = await visit(url);
    const problems = [...exceptions.map(e => `exception: ${e}`), ...failed.map(f => `ressource: ${f}`)];
    const detail = extra ? await extra() : '';
    record(`${name} (${path})`, problems.length === 0, problems.length ? problems.join(' | ') : detail || 'OK');
    if (consoleErrors.length) record(`${name} console.error`, true, consoleErrors.join(' | '), 'warn');
    if (analytics.length) record(`${name} analytics`, true, `Umami : ${analytics.join(' | ')}`, 'warn');

    const structProblems = await structure();
    record(`${name} structure`, structProblems.length === 0, structProblems.join(' | ') || "main#content, 1 h1, lang, lien d'évitement au 1er Tab");

    const violations = await axeAudit();
    const blocking = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
    const minor = violations.filter(v => !blocking.includes(v));
    const fmt = vs => vs.map(v => `${v.id} [${v.impact}] ×${v.nodes} (${v.target.slice(0, 60)})`).join(' | ');
    record(
      `${name} axe WCAG`,
      blocking.length === 0,
      blocking.length ? fmt(blocking) : `0 violation grave${minor.length ? `, ${minor.length} mineure(s)` : ''}`
    );
    if (minor.length) record(`${name} axe (mineur)`, true, fmt(minor), 'warn');
  } catch (err) {
    record(`${name} (${path})`, false, err.message);
  }
}

// ---------------------------------------------------------------- Accueil
await checkPage('accueil', '/fr/', async () => {
  const navLinks = await count('[data-testid="nav-main"] a');
  if (navLinks < 3) throw new Error(`${navLinks} liens dans la navigation principale`);
  const current = await page.evaluate(() => document.querySelector('[data-testid="nav-main"] [aria-current="page"]')?.textContent?.trim());
  const chrome = await page.evaluate(() => ({
    footer: !!document.querySelector('[data-testid="site-footer"]'),
    cv: !!document.querySelector('[data-testid="cv-floating"]'),
  }));
  if (!chrome.footer || !chrome.cv) throw new Error(`pied de page ${chrome.footer}, bouton CV ${chrome.cv} (attendus sur l'accueil)`);
  return `${navLinks} liens de navigation, page courante : « ${current || 'aucune'} », pied de page + bouton CV présents`;
});

// ---------------------------------------------------------------- Blog
let firstArticle = null;
await checkPage('blog', '/fr/blog/', async () => {
  const cards = await count('[data-testid="blog-card"]');
  if (cards < 10) throw new Error(`seulement ${cards} cartes d'articles`);
  firstArticle = await page.evaluate(() => document.querySelector('[data-testid="blog-card"][data-source="local"]')?.getAttribute('href'));

  // Recherche (sans LLM) : « kaniko » doit réduire la liste et mettre à jour le compteur annoncé.
  await page.fill('[data-testid="blog-search"]', 'kaniko');
  await page.waitForFunction(n => document.querySelectorAll('[data-testid="blog-card"]').length < n, cards, {
    timeout: 5000,
  });
  const found = await count('[data-testid="blog-card"]');
  const status = await page.evaluate(() => document.querySelector('[data-testid="blog-count"]')?.textContent?.trim());
  if (found < 1) throw new Error('la recherche « kaniko » ne trouve rien');
  await page.click('[data-testid="blog-search-clear"]', { label: 'effacer la recherche' });

  // Filtre par tag : bouton à bascule (aria-pressed).
  const tag = await page.evaluate(() => document.querySelectorAll('[data-testid="blog-tag"]')[1]?.getAttribute('data-tag'));
  await page.click(`[data-testid="blog-tag"][data-tag="${tag}"]`, { label: 'filtrer par tag' });
  const pressed = await page.evaluate(t => document.querySelector(`[data-testid="blog-tag"][data-tag="${t}"]`)?.getAttribute('aria-pressed'), tag);
  if (pressed !== 'true') throw new Error(`tag « ${tag} » : aria-pressed=${pressed}`);
  return `${cards} cartes ; recherche « kaniko » → ${found} (${status}) ; tag « ${tag} » aria-pressed OK`;
});

// ---------------------------------------------------------------- Article
if (firstArticle) {
  await checkPage('article', firstArticle, async () => {
    const info = await page.evaluate(() => ({
      title: document.querySelector('[data-testid="article-title"]')?.textContent?.trim() || '',
      date: document.querySelector('[data-testid="article-date"]')?.getAttribute('datetime') || '',
      chars: document.querySelector('[data-testid="article-content"]')?.innerText.length || 0,
      labelled: document.querySelector('[data-testid="article"]')?.getAttribute('aria-labelledby'),
    }));
    if (!info.title) throw new Error('pas de titre (article-title)');
    if (info.chars < 1000) throw new Error(`contenu trop court (${info.chars} car.)`);
    if (!info.date) throw new Error('date sans attribut datetime');
    return `« ${info.title.slice(0, 40)} », ${info.chars} car., <time> OK, article étiqueté par ${info.labelled}`;
  });
} else {
  record('article', false, "aucune carte d'article local trouvée sur /fr/blog/");
}

// ---------------------------------------------------------------- Chat (sans envoi)
await checkPage('chat', '/fr/chat/', async () => {
  const ui = await page.evaluate(() => {
    const input = document.querySelector('[data-testid="chat-input"]');
    return {
      suggestions: document.querySelectorAll('[data-testid="chat-suggestion"]').length,
      inputLabel: input ? document.querySelector(`label[for="${input.id}"]`)?.textContent?.trim() : null,
      sendLabel: document.querySelector('[data-testid="chat-send"]')?.getAttribute('aria-label'),
      described: input?.getAttribute('aria-describedby'),
      footer: !!document.querySelector('[data-testid="site-footer"]'),
      cv: !!document.querySelector('[data-testid="cv-floating"]'),
    };
  });
  if (ui.footer || ui.cv) throw new Error(`interface non épurée : pied de page ${ui.footer}, bouton CV ${ui.cv}`);
  if (ui.suggestions < 4) throw new Error(`${ui.suggestions} suggestions affichées`);
  if (!ui.inputLabel) throw new Error('champ de saisie sans <label>');
  if (!ui.sendLabel) throw new Error("bouton d'envoi sans nom accessible");
  const shot = await page.screenshot({ path: `${OUT}/chat-desktop.png` }).catch(() => null);
  return `${ui.suggestions} suggestions, label « ${ui.inputLabel} », envoi « ${ui.sendLabel} », aide ${ui.described}${shot ? `, capture ${shot}` : ''}`;
});

// ------------------------------------------------ Mouvement réduit (WCAG 2.3.3)
// Préférence émulée : pas de fond WebGL animé (Vanta), aucune animation CSS infinie.
try {
  await page.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await page.goto(`${BASE}/fr/`);
  await page.waitForLoadState();
  await page.waitForTimeout(2000);
  const motion = await page.evaluate(() => ({
    canvases: document.querySelectorAll('canvas').length,
    infinite: document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getTiming?.().iterations === Infinity).length,
  }));
  const problems = [];
  if (motion.canvases) problems.push(`${motion.canvases} canvas animé(s) (fond Vanta ?)`);
  if (motion.infinite) problems.push(`${motion.infinite} animation(s) CSS infinie(s) en cours`);
  record('mouvement réduit (/fr/)', problems.length === 0, problems.join(' | ') || 'pas de fond animé, aucune animation infinie');
} catch (err) {
  record('mouvement réduit (/fr/)', false, err.message);
} finally {
  await page.cdp('Emulation.setEmulatedMedia', { features: [] }).catch(() => {});
}

// ------------------------------------ Conversation simulée (sans appel LLM)
// ego lite intercepte POST /api/chat (CDP Fetch) et répond un flux « UI Message Stream »
// préenregistré contenant un lien d'article : bulles, cartes de sources et audit axe
// sur une vraie conversation, de façon déterministe et sans consommer de quota.
try {
  await page.goto(`${BASE}/fr/chat/`);
  await page.waitForLoadState();
  await page.waitForTimeout(1000);
  await page.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/api/chat*', requestStage: 'Request' }] });
  await page.events();
  await page.click('[data-testid="chat-suggestion"] >> nth=0', { label: 'question suggérée' });
  let paused = null;
  for (let i = 0; i < 40 && !paused; i++) {
    await page.waitForTimeout(250);
    paused = (await page.events()).find(e => e.method === 'Fetch.requestPaused');
  }
  if (!paused) throw new Error("la requête /api/chat n'a pas été émise");
  const article = '/blog/build-images-kubernetes-kaniko-crane/';
  const stream =
    [
      { type: 'start' },
      { type: 'text-start', id: 't1' },
      { type: 'text-delta', id: 't1', delta: `Oui, voici son article : [Kaniko + Crane](${article}).` },
      { type: 'text-end', id: 't1' },
      { type: 'finish' },
    ]
      .map(e => `data: ${JSON.stringify(e)}\n\n`)
      .join('') + 'data: [DONE]\n\n';
  await page.cdp('Fetch.fulfillRequest', {
    requestId: paused.params.requestId,
    responseCode: 200,
    responseHeaders: [
      { name: 'content-type', value: 'text/event-stream' },
      { name: 'x-vercel-ai-ui-message-stream', value: 'v1' },
    ],
    body: Buffer.from(stream).toString('base64'),
  });
  await page.waitForSelector('[data-testid="chat-source-card"]', { state: 'visible', timeout: 8000 });
  const conv = await page.evaluate(() => {
    const log = document.querySelector('[data-testid="chat-log"]').getBoundingClientRect();
    const box = role => document.querySelector(`[data-testid="chat-message"][data-role="${role}"] .chat-bubble`)?.getBoundingClientRect();
    const u = box('user');
    const a = box('assistant');
    return {
      userRight: u ? Math.round(log.right - u.right) : null,
      userLeft: u ? Math.round(u.left - log.left) : null,
      aiLeft: a ? Math.round(a.left - log.left) : null,
      sources: [...document.querySelectorAll('[data-testid="chat-source-card"]')].map(el => el.getAttribute('href')),
      listLabel: document.querySelector('[data-testid="chat-sources"]')?.getAttribute('aria-label'),
    };
  });
  const problems = [];
  if (conv.userRight === null || conv.userRight > 24) problems.push(`bulle visiteur non alignée à droite (écart ${conv.userRight}px)`);
  if (conv.userLeft !== null && conv.userLeft < 40) problems.push('bulle visiteur pleine largeur');
  if (conv.aiLeft === null || conv.aiLeft > 24) problems.push(`bulle Jamila non alignée à gauche (écart ${conv.aiLeft}px)`);
  if (conv.sources.length !== 1 || conv.sources[0] !== `/fr${article}`) problems.push(`cartes de sources : ${JSON.stringify(conv.sources)}`);
  else {
    const head = await fetch(BASE + conv.sources[0], { method: 'HEAD', redirect: 'follow' });
    if (head.status !== 200) problems.push(`carte de source ${conv.sources[0]} -> HTTP ${head.status}`);
  }
  record(
    'conversation simulée',
    problems.length === 0,
    problems.join(' | ') || `visiteur à droite, Jamila à gauche, 1 carte « ${conv.listLabel} » -> ${conv.sources[0]} (200)`
  );
  const violations = await axeAudit();
  const blocking = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  record(
    'conversation axe WCAG',
    blocking.length === 0,
    blocking.map(v => `${v.id} [${v.impact}] ×${v.nodes} (${v.target.slice(0, 60)})`).join(' | ') || '0 violation grave'
  );
} catch (err) {
  record('conversation simulée', false, err.message);
} finally {
  await page.cdp('Fetch.disable').catch(() => {});
}

// --------------------------------------------------------- Rendu mobile
try {
  await page.cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await page.reload();
  await page.waitForLoadState();
  await page.waitForTimeout(1000);
  const m = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: window.innerWidth,
    burger: document.querySelector('[data-testid="nav-burger"]')?.getAttribute('aria-label'),
  }));
  const shot = await page.screenshot({ path: `${OUT}/chat-mobile.png` }).catch(() => null);
  const problems = [];
  if (m.scroll > m.width + 1) problems.push(`débordement horizontal : ${m.scroll}px > ${m.width}px`);
  if (!m.burger) problems.push('bouton de menu mobile sans nom accessible');
  record(
    'mobile 390px (/fr/chat/)',
    problems.length === 0,
    problems.join(' | ') || `pas de débordement, menu « ${m.burger} »${shot ? `, capture ${shot}` : ''}`
  );
} catch (err) {
  record('mobile 390px (/fr/chat/)', false, err.message);
} finally {
  await page.cdp('Emulation.clearDeviceMetricsOverride').catch(() => {});
}

await task.finish({ keep: [] });

// --------------------------------------------------------------- Rapport
const icon = { ok: '✅', warn: '⚠️ ', fail: '❌' };
console.log(`\nVérification UI + accessibilité (ego lite) — ${BASE}\n`);
for (const r of results) console.log(`${icon[r.level]} ${r.name.padEnd(28)} ${r.detail}`);
const failed = results.filter(r => !r.ok).length;
const checks = results.filter(r => r.level !== 'warn');
console.log(`\n${checks.length - failed}/${checks.length} OK${failed ? ` — ${failed} échec(s)` : ''}`);
console.log(`UI_RESULT=${failed ? 'FAIL' : 'OK'}`);

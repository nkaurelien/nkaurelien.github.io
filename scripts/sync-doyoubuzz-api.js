/**
 * Script de Synchronisation Directe via l'API REST de DoYouBuzz
 * Documentation officielle : https://doc.doyoubuzz.com/dyb/cv
 * Endpoint : GET https://api.doyoubuzz.com/cv/:id
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Fichier de destination JSON Resume
const OUTPUT_PATH = path.join(__dirname, '../public/cv.json');

/**
 * Mappe la structure API DoYouBuzz vers le standard JSON Resume schema v1.0.0
 */
function mapDoYouBuzzApiToJSONResume(dybData) {
  const user = dybData.userInformation || {};
  const presentation = dybData.presentation || {};
  
  const basics = {
    name: 'Astrid Aurelien NKUMBE ENONGENE',
    label: dybData.title || 'Senior Fullstack Engineer & Tech Lead',
    email: 'nkumbeaurelien@hotmail.com',
    phone: '+33 7 44 58 45 62',
    url: 'https://www.doyoubuzz.com/astrid-aurelien-nkumbe-enongene',
    summary: presentation.text || 'Senior Fullstack Engineer et Technical Lead avec plus de 7 ans d\'expérience dans la conception, l\'architecture et le déploiement d\'applications web, mobiles, IoT et IA.',
    location: {
      city: user.city || 'Paris / Cergy',
      countryCode: 'FR',
      region: 'Région Parisienne — Mobile France entière & Remote'
    },
    profiles: [
      { network: 'GitHub', username: 'nkaurelien', url: 'https://github.com/nkaurelien' },
      { network: 'LinkedIn', username: 'nkaurelien', url: 'https://www.linkedin.com/in/nkaurelien/' },
      { network: 'DoYouBuzz', username: 'astrid-aurelien-nkumbe-enongene', url: 'https://www.doyoubuzz.com/astrid-aurelien-nkumbe-enongene' }
    ]
  };

  const rawExps = dybData.experiences?.experience || dybData.experiences || [];
  const work = (Array.isArray(rawExps) ? rawExps : []).map(exp => {
    const rawMissions = exp.missions?.mission || exp.missions || [];
    const highlights = (Array.isArray(rawMissions) ? rawMissions : []).map(m => m.description).filter(Boolean);

    return {
      name: exp.company || '',
      position: exp.title || '',
      startDate: exp.start || null,
      endDate: exp.end || null,
      summary: exp.description || exp.title || '',
      highlights,
      keywords: []
    };
  });

  const rawEdus = dybData.educations?.education || dybData.educations || [];
  const education = (Array.isArray(rawEdus) ? rawEdus : []).map(edu => ({
    institution: edu.school || edu.schoolName || '',
    area: edu.degree || edu.diploma || '',
    studyType: edu.degree || edu.diploma || '',
    startDate: edu.start || null,
    endDate: edu.end || null,
    summary: edu.description || ''
  }));

  const rawSkills = dybData.skills?.skill || dybData.skills || [];
  const skills = (Array.isArray(rawSkills) ? rawSkills : []).map(cat => {
    const rawChildren = cat.children?.skill || cat.children || [];
    return {
      name: cat.title || cat.description || '',
      keywords: (Array.isArray(rawChildren) ? rawChildren : []).map(sub => sub.title || sub.description).filter(Boolean)
    };
  });

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics,
    work,
    education,
    skills
  };
}

/**
 * Exécute la requête HTTP vers l'API DoYouBuzz
 */
function fetchDoYouBuzzCv(cvId, apiKey) {
  const options = {
    hostname: 'api.doyoubuzz.com',
    port: 443,
    path: `/cv/${cvId}`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Antigravity-CV-Sync/1.0',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    }
  };

  console.log(`🌐 Connexion à l'API DoYouBuzz (GET https://api.doyoubuzz.com/cv/${cvId})...`);

  const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const dybJson = JSON.parse(body);
          const converted = mapDoYouBuzzApiToJSONResume(dybJson);
          fs.writeFileSync(OUTPUT_PATH, JSON.stringify(converted, null, 2), 'utf8');
          console.log(`✅ Synchronisation API réussie ! ${OUTPUT_PATH} mis à jour.`);
        } catch (err) {
          console.error(`❌ Erreur d'analyse JSON de la réponse API :`, err.message);
        }
      } else {
        console.error(`❌ Erreur HTTP API DoYouBuzz : statut ${res.statusCode} ${res.statusMessage}`);
        console.error(body);
      }
    });
  });

  req.on('error', err => {
    console.error(`❌ Erreur de connexion au serveur DoYouBuzz :`, err.message);
  });

  req.end();
}

// Arguments de ligne de commande
const cvId = process.argv[2] || process.env.DOYOUBUZZ_CV_ID;
const apiKey = process.argv[3] || process.env.DOYOUBUZZ_API_KEY;

if (!cvId) {
  console.log(`ℹ️ Usage : node scripts/sync-doyoubuzz-api.js <CV_ID> [API_KEY]`);
  console.log(`💡 Exemple : node scripts/sync-doyoubuzz-api.js 12345`);
  process.exit(0);
}

fetchDoYouBuzzCv(cvId, apiKey);

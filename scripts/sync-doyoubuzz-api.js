/**
 * Script de Synchronisation Directe via l'API REST de DoYouBuzz
 * Documentation officielle : https://doc.doyoubuzz.com/dyb/cv
 * Endpoint : GET https://api.doyoubuzz.com/cv/:id
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Fichiers de destination JSON Resume
const DATASOURCES_PATH = path.join(__dirname, '../datasources/cv.json');
const PUBLIC_PATH = path.join(__dirname, '../public/cv.json');

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

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics,
    work,
    education
  };
}

const cvId = process.argv[2];
const apiKey = process.argv[3];

if (!cvId) {
  console.log('💡 Usage : node scripts/sync-doyoubuzz-api.js <cv_id> [api_key]');
  process.exit(0);
}

const options = {
  hostname: 'api.doyoubuzz.com',
  path: `/cv/${cvId}?format=json`,
  method: 'GET',
  headers: {
    'User-Agent': 'NodeJS-DoYouBuzz-Sync'
  }
};

if (apiKey) {
  options.headers['Authorization'] = `Bearer ${apiKey}`;
}

https.get(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const mapped = mapDoYouBuzzApiToJSONResume(parsed);
      fs.writeFileSync(DATASOURCES_PATH, JSON.stringify(mapped, null, 2), 'utf8');
      fs.writeFileSync(PUBLIC_PATH, JSON.stringify(mapped, null, 2), 'utf8');
      console.log(`✅ Synchronisation réussie pour le CV ID: ${cvId}`);
      console.log(`🚀 datasources/cv.json et public/cv.json ont été mis à jour !`);
    } catch (e) {
      console.error('❌ Erreur lors du parsing des données API DoYouBuzz:', e.message);
    }
  });
}).on('error', (err) => {
  console.error('❌ Erreur de requête HTTPS vers DoYouBuzz:', err.message);
});

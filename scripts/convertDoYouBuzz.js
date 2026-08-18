const fs = require('fs');
const path = require('path');

function convertDoYouBuzzToJSONResume(dybData) {
  const owner = dybData.owner || {};
  const contacts = dybData.contacts || {};
  
  const basics = {
    name: `${owner.firstname || ''} ${owner.lastname || ''}`.trim() || 'Aurelien NKUMBE',
    label: dybData.title?.value || 'Senior Fullstack Engineer & Tech Lead',
    email: contacts.public_email || owner.login || 'nkumbeaurelien@hotmail.com',
    phone: contacts.mobile || '+33 7 44 58 45 62',
    url: owner.url || 'https://nkaurelien.github.io',
    summary: 'Senior Fullstack Engineer et Technical Lead avec plus de 7 ans d\'expérience dans la conception, l\'architecture et le déploiement d\'applications web, mobiles, IoT et IA.',
    location: {
      city: contacts.address?.city || 'Paris / Cergy',
      countryCode: contacts.address?.country || 'FR',
      region: 'Région Parisienne — Mobile France entière & Remote'
    },
    profiles: [
      { network: 'GitHub', username: 'nkaurelien', url: 'https://github.com/nkaurelien' },
      { network: 'LinkedIn', username: 'nkaurelien', url: 'https://www.linkedin.com/in/nkaurelien/' },
      { network: 'DoYouBuzz', username: 'astrid-aurelien-nkumbe-enongene', url: 'https://www.doyoubuzz.com/astrid-aurelien-nkumbe-enongene' }
    ]
  };

  const work = (dybData.experiences || []).map(exp => {
    const startObj = exp.range?.start || {};
    const endObj = exp.range?.end || {};
    
    const startDate = startObj.year && startObj.month ? `${startObj.year}-${startObj.month}-01` : null;
    const endDate = endObj.year && endObj.year !== '-1' ? `${endObj.year}-${endObj.month || '01'}-01` : null;

    const highlights = [];
    (exp.missions || []).forEach(m => {
      if (m.description) {
        m.description.split('\n').forEach(line => {
          const cleaned = line.replace(/^-\s*/, '').trim();
          if (cleaned && cleaned !== 'Réalisations') highlights.push(cleaned);
        });
      }
    });

    const envs = (exp.environments || []).map(e => e.description).join(' ');
    const keywords = envs ? envs.replace(/^-\s*/gm, '').split(/[,;·\n]/).map(k => k.trim()).filter(Boolean) : [];

    return {
      name: exp.company || '',
      position: exp.title || '',
      startDate,
      endDate,
      summary: (exp.contexts || []).map(c => c.description).join(' ') || exp.title || '',
      highlights,
      keywords
    };
  });

  const education = (dybData.educations || []).map(edu => {
    const startObj = edu.range?.start || {};
    const endObj = edu.range?.end || {};
    return {
      institution: edu.schoolName || '',
      area: edu.diploma || '',
      studyType: edu.diploma || '',
      startDate: startObj.year ? `${startObj.year}-01-01` : null,
      endDate: endObj.year ? `${endObj.year}-01-01` : null,
      summary: edu.description || ''
    };
  });

  const skills = (dybData.skills || []).map(cat => ({
    name: cat.description || '',
    keywords: (cat.children || []).map(sub => sub.description).filter(Boolean)
  }));

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics,
    work,
    education,
    skills
  };
}

// Exécution dynamique
const customInput = process.argv[2];
const inputPath = customInput && customInput.trim() !== '' 
  ? path.resolve(customInput) 
  : '/Volumes/X9 Pro/Downloads/davidson-Astrid-Aurelien-NKUMBE-ENONGENE.json';

if (fs.existsSync(inputPath)) {
  const dybData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const converted = convertDoYouBuzzToJSONResume(dybData);
  
  const outputPath = path.join(__dirname, '../public/cv.json');
  fs.writeFileSync(outputPath, JSON.stringify(converted, null, 2), 'utf8');
  console.log(`✅ Conversion DoYouBuzz réussie ! Fichier : ${inputPath}`);
  console.log(`🚀 cv.json mis à jour dans : ${outputPath}`);
} else {
  console.error(`❌ Fichier introuvable : ${inputPath}`);
}

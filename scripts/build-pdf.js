const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const cssPath = path.join(rootDir, 'scripts', 'cv-style.css');
const publicDir = path.join(rootDir, 'public');
const datasourcesDir = path.join(rootDir, 'datasources');
const datasourcesCvDir = path.join(datasourcesDir, 'cv');

const cvFiles = [
  { input: path.join(rootDir, 'cv.md'), outputName: 'cv.pdf', copyToDatasources: true },
  { input: path.join(datasourcesCvDir, 'cv-lite.md'), outputName: 'cv-lite.pdf' },
  { input: path.join(datasourcesCvDir, 'dossier-de-competences.md'), outputName: 'dossier-de-competences.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-fullstack.md'), outputName: 'cv-fullstack.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-angular-laravel.md'), outputName: 'cv-angular-laravel.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-devops.md'), outputName: 'cv-devops.pdf' },
];

console.log('📄 Conversion de tous les CV (Markdown -> PDF)...');

try {
  cvFiles.forEach(({ input, outputName, copyToDatasources }) => {
    if (!fs.existsSync(input)) {
      console.warn(`⚠️ Fichier introuvable, ignoré: ${input}`);
      return;
    }

    const targetPdfRoot = path.join(rootDir, outputName);
    const targetPdfPublic = path.join(publicDir, outputName);

    console.log(`🔨 Generation de ${outputName} depuis ${path.basename(input)}...`);
    const command = `pandoc "${input}" -o "${targetPdfRoot}" --css="${cssPath}" --pdf-engine=weasyprint`;
    execSync(command, { stdio: 'inherit', cwd: rootDir });

    if (fs.existsSync(targetPdfRoot)) {
      fs.copyFileSync(targetPdfRoot, targetPdfPublic);
      if (copyToDatasources) {
        fs.copyFileSync(targetPdfRoot, path.join(datasourcesDir, outputName));
      }
    }

    // Copie le fichier .md correspondant dans public/ pour la prévisualisation web
    const mdName = path.basename(input);
    fs.copyFileSync(input, path.join(publicDir, mdName));
  });

  // Synchro des fichiers JSON et Markdown principaux dans public/
  const cvMd = path.join(rootDir, 'cv.md');
  const cvJson = path.join(rootDir, 'cv.json');
  if (fs.existsSync(cvMd)) fs.copyFileSync(cvMd, path.join(publicDir, 'cv.md'));
  if (fs.existsSync(cvJson)) fs.copyFileSync(cvJson, path.join(publicDir, 'cv.json'));

  console.log('✅ Tous les CV et Dossier de compétences ont été compilés en PDF et servis dans public/ !');
} catch (err) {
  console.error('❌ Erreur lors de la génération des PDF :', err.message);
  process.exit(1);
}

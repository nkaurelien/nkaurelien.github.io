const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const cssPath = path.join(rootDir, 'scripts', 'cv-style.css');
const publicDir = path.join(rootDir, 'public');
const datasourcesDir = path.join(rootDir, 'datasources');
const datasourcesCvDir = path.join(datasourcesDir, 'cv');

const cvFiles = [
  { input: path.join(datasourcesDir, 'cv.md'), outputName: 'cv.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-lite.md'), outputName: 'cv-lite.pdf' },
  { input: path.join(datasourcesCvDir, 'dossier-de-competences.md'), outputName: 'dossier-de-competences.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-fullstack.md'), outputName: 'cv-fullstack.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-angular-laravel.md'), outputName: 'cv-angular-laravel.pdf' },
  { input: path.join(datasourcesCvDir, 'cv-devops.md'), outputName: 'cv-devops.pdf' },
];

console.log('📄 Conversion de tous les CV (Markdown -> PDF)...');

try {
  cvFiles.forEach(({ input, outputName }) => {
    if (!fs.existsSync(input)) {
      console.warn(`⚠️ Fichier introuvable, ignoré: ${input}`);
      return;
    }

    const targetPdfPublic = path.join(publicDir, outputName);

    console.log(`🔨 Generation de ${outputName} depuis ${path.basename(input)}...`);
    const command = `pandoc "${input}" -o "${targetPdfPublic}" --css="${cssPath}" --pdf-engine=weasyprint`;
    execSync(command, { stdio: 'inherit', cwd: rootDir });

    // Copie le fichier .md correspondant dans public/ pour la prévisualisation web
    const mdName = path.basename(input);
    fs.copyFileSync(input, path.join(publicDir, mdName));
  });

  // Synchro des fichiers JSON et Markdown principaux depuis datasources/ vers public/
  const cvMdDatasource = path.join(datasourcesDir, 'cv.md');
  const cvJsonDatasource = path.join(datasourcesDir, 'cv.json');
  if (fs.existsSync(cvMdDatasource)) fs.copyFileSync(cvMdDatasource, path.join(publicDir, 'cv.md'));
  if (fs.existsSync(cvJsonDatasource)) fs.copyFileSync(cvJsonDatasource, path.join(publicDir, 'cv.json'));

  console.log('✅ Tous les CV et Dossier de compétences ont été compilés en PDF et servis dans public/ !');
} catch (err) {
  console.error('❌ Erreur lors de la génération des PDF :', err.message);
  process.exit(1);
}

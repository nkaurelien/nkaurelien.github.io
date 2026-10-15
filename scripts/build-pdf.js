const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const cssPath = path.join(rootDir, 'scripts', 'cv-style.css');
const publicDir = path.join(rootDir, 'public');
const datasourcesDir = path.join(rootDir, 'datasources');
const datasourcesCvDir = path.join(datasourcesDir, 'cv');

const cvFiles = [
  { input: path.join(datasourcesDir, 'about-me.md'), outputName: 'about.pdf' },
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
  const aboutMdDatasource = path.join(datasourcesDir, 'about-me.md');
  if (fs.existsSync(cvMdDatasource)) fs.copyFileSync(cvMdDatasource, path.join(publicDir, 'cv.md'));
  if (fs.existsSync(cvJsonDatasource)) fs.copyFileSync(cvJsonDatasource, path.join(publicDir, 'cv.json'));
  if (fs.existsSync(aboutMdDatasource)) fs.copyFileSync(aboutMdDatasource, path.join(publicDir, 'about.md'));

  // Compilation et synchronisation des templates LaTeX
  try {
    const latexSarvesh = path.join(rootDir, 'latex', 'sarvesh-parab-cv');
    if (fs.existsSync(path.join(latexSarvesh, 'cv.tex'))) {
      execSync('pdflatex -interaction=nonstopmode cv.tex && pdflatex -interaction=nonstopmode cv.tex', { cwd: latexSarvesh, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexSarvesh, 'cv.pdf'), path.join(publicDir, 'Astrid_Aurelien_NKUMBE_ENONGENE_CV.pdf'));
      fs.copyFileSync(path.join(latexSarvesh, 'cv.pdf'), path.join(publicDir, 'cv.pdf'));
    }
    const latexCurve = path.join(rootDir, 'latex', 'customised-curve-cv');
    if (fs.existsSync(path.join(latexCurve, 'cv-llt.tex'))) {
      execSync('pdflatex -interaction=nonstopmode cv-llt.tex && pdflatex -interaction=nonstopmode cv-llt.tex', { cwd: latexCurve, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexCurve, 'cv-llt.pdf'), path.join(publicDir, 'cv-curve.pdf'));
    }
    if (fs.existsSync(path.join(latexCurve, 'cv-curve.tex'))) {
      execSync('pdflatex -interaction=nonstopmode cv-curve.tex && pdflatex -interaction=nonstopmode cv-curve.tex', { cwd: latexCurve, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexCurve, 'cv-curve.pdf'), path.join(publicDir, 'cv-curve-data2innov.pdf'));
    }
    const latexVidushi = path.join(rootDir, 'latex', 'vidushi-wahal-cv');
    if (fs.existsSync(path.join(latexVidushi, 'cv.tex'))) {
      execSync('pdflatex -interaction=nonstopmode cv.tex && pdflatex -interaction=nonstopmode cv.tex', { cwd: latexVidushi, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexVidushi, 'cv.pdf'), path.join(publicDir, 'cv-vidushi-wahal.pdf'));
    }
    const latexLettre = path.join(rootDir, 'latex', 'lettre-de-motivation');
    if (fs.existsSync(path.join(latexLettre, 'lettre-de-motivation-globale.tex'))) {
      execSync('pdflatex -interaction=nonstopmode lettre-de-motivation-globale.tex', { cwd: latexLettre, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexLettre, 'lettre-de-motivation-globale.pdf'), path.join(publicDir, 'lettre-de-motivation-globale.pdf'));
    }
    const latexEnBref = path.join(rootDir, 'latex', 'en-bref');
    if (fs.existsSync(path.join(latexEnBref, 'about.tex'))) {
      execSync('pdflatex -interaction=nonstopmode about.tex && pdflatex -interaction=nonstopmode about.tex', { cwd: latexEnBref, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexEnBref, 'about.pdf'), path.join(publicDir, 'about.pdf'));
    }
    const latexDossier = path.join(rootDir, 'latex', 'dossier-de-competences');
    if (fs.existsSync(path.join(latexDossier, 'dossier.tex'))) {
      execSync('pdflatex -interaction=nonstopmode dossier.tex && pdflatex -interaction=nonstopmode dossier.tex', { cwd: latexDossier, stdio: 'ignore' });
      fs.copyFileSync(path.join(latexDossier, 'dossier.pdf'), path.join(publicDir, 'dossier-de-competences.pdf'));
    }
    console.log('🎯 Synchronisation des templates LaTeX vers public/ effectuée avec succès !');
  } catch (latexErr) {
    console.warn('⚠️ Compilation LaTeX optionnelle passée :', latexErr.message);
  }

  console.log('✅ Tous les CV et Dossier de compétences ont été compilés en PDF et servis dans public/ !');
} catch (err) {
  console.error('❌ Erreur lors de la génération des PDF :', err.message);
  process.exit(1);
}

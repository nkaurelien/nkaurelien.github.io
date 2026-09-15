# 📑 CV LaTeX — Astrid-Aurélien NKUMBE ENONGENE

Ce répertoire contient l'ensemble des sources LaTeX organisées en sous-répertoires par modèle source.

## 📂 Structure des Modèles LaTeX

```text
latex/
├── vidushi-wahal-cv/           # Modèle 1 : Source Overleaf "Vidushi Wahal's CV"
│   ├── cv.tex                 # Source LaTeX unique
│   └── cv.pdf                 # PDF compilé (2 pages)
│
├── customised-curve-cv/       # Modèle 2 : Source "A Customised CurVe CV" (LianTze Lim)
│   ├── cv-llt.tex             # Point d'entrée principal
│   ├── settings.sty           # Fichier de styles & thèmes TikZ/FontAwesome
│   ├── employment.tex         # Rubrique Expériences Professionnelles
│   ├── skills.tex             # Rubrique Compétences Techniques
│   ├── projects.tex          # Rubrique Projets & Ingénierie Pédagogique
│   ├── education.tex         # Rubrique Formations & Diplômes
│   ├── misc.tex              # Rubrique Formations dispensées, Langues & Publications
│   └── cv-llt.pdf            # PDF compilé (3 pages)
│
└── sarvesh-parab-cv/          # Modèle 3 : Source "Sarvesh Parab's Resume" (resume.cls)
    ├── cv.tex                 # Source LaTeX principal
    ├── resume.cls             # Fichier de classe custom resume.cls
    └── cv.pdf                 # PDF compilé (2 pages)
```

---

## 🛠️ Compilation Locale

### 1. Modèle Overleaf Classique (`vidushi-wahal-cv`)
```bash
cd latex/vidushi-wahal-cv
pdflatex -interaction=nonstopmode cv.tex
```

### 2. Modèle CurVe Modulaire (`customised-curve-cv`)
```bash
cd latex/customised-curve-cv
pdflatex -interaction=nonstopmode cv-llt.tex
```

### 3. Modèle Resume Class (`sarvesh-parab-cv`)
```bash
cd latex/sarvesh-parab-cv
pdflatex -interaction=nonstopmode cv.tex
```

---

## ☁️ Utilisation sur Overleaf

- **Vidushi Wahal's CV** : Téléversez le fichier [cv.tex](file:///Volumes/X9%20Pro/Workspaces/nkaurelien/nkaurelien.github.io/latex/vidushi-wahal-cv/cv.tex).
- **Customised CurVe CV** : Téléversez l'intégralité du dossier [customised-curve-cv](file:///Volumes/X9%20Pro/Workspaces/nkaurelien/nkaurelien.github.io/latex/customised-curve-cv).
- **Sarvesh Parab's Resume** : Téléversez l'intégralité du dossier [sarvesh-parab-cv](file:///Volumes/X9%20Pro/Workspaces/nkaurelien/nkaurelien.github.io/latex/sarvesh-parab-cv) (`cv.tex` + `resume.cls`).

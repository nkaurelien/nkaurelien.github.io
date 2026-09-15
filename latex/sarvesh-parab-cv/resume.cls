\ProvidesClass{resume}[2010/07/10 v1.0 Resume class]

\LoadClass[10pt,a4paper]{article}

\RequirePackage[parfill]{parskip} % Do not indent paragraphs
\RequirePackage{array} % required for bolding columns within tables
\RequirePackage{ifthen}
\RequirePackage[utf8]{inputenc}
\RequirePackage[T1]{fontenc}
\RequirePackage[french]{babel}

\pagestyle{empty} % Suppress page numbers

%----------------------------------------------------------------------------------------
%	HEADINGS COMMANDS
%----------------------------------------------------------------------------------------

\def \name#1{\def\@name{#1}} % Defines the name
\def \address#1{\def\@address{#1}} % Defines the address

\def \printname {
  \begingroup
    \hfil{\MakeUppercase{\namesize\bfseries \@name}}\hfil
    \nameskip\break
  \endgroup
}

\def \printaddress {
  \begingroup
    \centering \addresssize \@address \par
    \vspace{4pt}
  \endgroup
}

\let\ori@document=\document
\renewcommand{\document}{
  \ori@document
  \printname
  \printaddress
}

\def \namesize {\LARGE} % Size of the name at the top
\def \nameskip {\vspace{3pt}} % Space after the name
\def \addresssize {\small} % Size of the address line
\def \addressskip {\vspace{2pt}} % Space after the address

%----------------------------------------------------------------------------------------
%	SECTION FORMATTING
%----------------------------------------------------------------------------------------

\newenvironment{rSection}[1]{
  \sectionskip
  {\MakeUppercase{\bfseries #1}}
  \sectionlineskip
  \hrule
  \begin{list}{}{
    \setlength{\leftmargin}{0em}
    \setlength{\parsep}{0pt}
    \setlength{\topsep}{2pt}
    \setlength{\partopsep}{0pt}
  }
  \item[]
}{
  \end{list}
}

\def \sectionskip {\vspace{6pt}} % Space before section
\def \sectionlineskip {\vspace{3pt}} % Space after section title line

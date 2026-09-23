import gsap from 'gsap';

// GSAP configuré pour le site : à importer à la place de 'gsap'
// (`import gsap from '@/lib/gsap'`).
//
// Mouvement réduit (WCAG 2.3.3, prefers-reduced-motion) : les animations deviennent
// quasi instantanées au lieu d'être supprimées, pour que les éléments animés depuis
// un état masqué (gsap.from opacity: 0…) atteignent quand même leur état final visible.
// Aucune animation du site n'est liée au défilement (scrub) ni infinie : accélérer la
// timeline globale suffit. Le réglage suit les changements de préférence en direct.
if (typeof window !== 'undefined' && window.matchMedia) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  const apply = () => gsap.globalTimeline.timeScale(query.matches ? 1000 : 1);
  apply();
  query.addEventListener?.('change', apply);
}

export default gsap;

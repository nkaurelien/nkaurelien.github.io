// Feature flags du site (evalues au build).
export const features = {
  // Protection des coordonnees du contact par hCaptcha.
  // Actif par defaut ; desactiver avec NEXT_PUBLIC_HCAPTCHA_ENABLED=false.
  contactHcaptcha: process.env.NEXT_PUBLIC_HCAPTCHA_ENABLED !== 'false',
};

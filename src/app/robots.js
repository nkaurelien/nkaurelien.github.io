// Génère /robots.txt (au lieu de tomber dans la route [locale]).
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  };
}

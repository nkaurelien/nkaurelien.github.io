'use client';

import { useEffect } from 'react';

// Redirection racine vers la locale par defaut (statique, sans middleware).
// `replace('fr/')` est relatif : fonctionne aussi bien a la racine qu'en sous-chemin.
export default function RootRedirect() {
  useEffect(() => {
    window.location.replace('fr/');
  }, []);

  return null;
}

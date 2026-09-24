'use client';

import { useState } from 'react';
import { Image, Stack, Text } from '@mantine/core';
import { IconWorld, IconAppWindow, IconDatabase, IconCode } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

// Icône du visuel de remplacement selon la catégorie du projet.
function categoryIcon(slug = '') {
  if (/data|ia|ai/.test(slug)) return IconDatabase;
  if (/website|site/.test(slug)) return IconWorld;
  if (/app/.test(slug)) return IconAppWindow;
  return IconCode;
}

// Vignette de projet : l'image si elle existe et se charge, sinon un visuel de remplacement
// aux couleurs Kamitbrains (lueur rouge sur fond quasi noir, trame de points, icône de catégorie).
export default function ProjectThumb({ src, alt, category, categorySlug, h = 180 }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return <Image src={withBase(src)} alt={alt} h={h} fit="cover" onError={() => setFailed(true)} />;
  }

  const Icon = categoryIcon(categorySlug);
  return (
    <Stack
      className="project-thumb-placeholder hero-dots"
      h={h}
      align="center"
      justify="center"
      gap={8}
      data-testid="project-thumb-placeholder"
      // Joue le rôle de l'image absente : nomme aussi le lien de la vignette.
      role="img"
      aria-label={alt}>
      <Icon aria-hidden="true" size={40} stroke={1.3} color="rgba(255, 255, 255, 0.85)" style={{ position: 'relative', zIndex: 1 }} />
      {category && (
        <Text
          aria-hidden="true"
          ff="monospace"
          fz={11}
          tt="uppercase"
          c="rgba(255, 255, 255, 0.6)"
          style={{ letterSpacing: 2, position: 'relative', zIndex: 1 }}>
          {category}
        </Text>
      )}
    </Stack>
  );
}

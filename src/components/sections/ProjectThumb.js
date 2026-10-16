'use client';

import { useState } from 'react';
import { Box, Image, Stack, Text } from '@mantine/core';
import { IconWorld, IconAppWindow, IconDatabase, IconCode } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import { useImageGradient } from '@/lib/imageEffects';

// Icône du visuel de remplacement selon la catégorie du projet.
function categoryIcon(slug = '') {
  if (/data|ia|ai/.test(slug)) return IconDatabase;
  if (/website|site/.test(slug)) return IconWorld;
  if (/app/.test(slug)) return IconAppWindow;
  return IconCode;
}

// Vignette de projet : l'image si elle existe et se charge, encadrée par un dégradé
// complémentaire extrait de ses 2 couleurs dominantes (façon grade-js), sinon un visuel
// de remplacement aux couleurs Kamitbrains.
export default function ProjectThumb({ src, alt, category, categorySlug, h = 196 }) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = src && !failed ? withBase(src) : null;
  const gradient = useImageGradient(resolvedSrc);

  if (resolvedSrc) {
    return (
      <Box
        className="project-thumb-grade"
        data-testid="project-thumb-grade"
        style={{
          position: 'relative',
          height: h,
          padding: '16px 20px',
          overflow: 'hidden',
          background: gradient.gradeLinear || gradient.linear,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Box
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 10px 26px rgba(0, 0, 0, 0.42)',
            border: '1px solid rgba(255, 255, 255, 0.22)',
          }}>
          <Image src={resolvedSrc} alt={alt} h="100%" w="100%" fit="cover" onError={() => setFailed(true)} />
        </Box>
        <Box
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 10,
            bottom: 8,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 6px',
            borderRadius: 999,
            backgroundColor: 'rgba(12, 9, 9, 0.78)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            pointerEvents: 'none',
          }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: gradient.primary,
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          />
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: gradient.secondary,
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          />
        </Box>
      </Box>
    );
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

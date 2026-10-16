'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Container, Text, Group, Box, Grid, Stack, UnstyledButton } from '@mantine/core';
import { IconEyeSpark } from '@tabler/icons-react';
import { useImageGradient, renderLenaFilterToDataUrl } from '@/lib/imageEffects';
import SectionHeading from './SectionHeading';

const VISION_MODES = [
  { id: 'original', label: 'Original' },
  { id: 'canny', label: 'Canny IA' },
  { id: 'sobel', label: 'Sobel' },
  { id: 'highpass', label: 'Highpass' },
];

// « 01. À propos » (inspiré de jev.dev) : photo + courte bio à gauche, compétences
// regroupées en étiquettes à droite. Intègre les filtres de vision par ordinateur
// (lena.js : Canny, Sobel, Highpass) et le halo de couleurs dominantes (grade-js).
export default function AboutIntro({ about }) {
  const photo = about?.photo?.url ? `/${about.photo.url.replace(/^\//, '')}` : null;
  const gradient = useImageGradient(photo);
  const [visionMode, setVisionMode] = useState('original');
  const [filteredSrc, setFilteredSrc] = useState(null);

  useEffect(() => {
    if (!photo || visionMode === 'original') {
      setFilteredSrc(null);
      return;
    }
    let cancelled = false;
    renderLenaFilterToDataUrl(photo, visionMode).then(dataUrl => {
      if (!cancelled) setFilteredSrc(dataUrl);
    });
    return () => {
      cancelled = true;
    };
  }, [photo, visionMode]);

  if (!about) return null;

  return (
    <Box component="section" id="about" aria-labelledby="about-title" data-testid="about-intro" className="hero-dots-soft" py={{ base: 90, md: 110 }}>
      <Container size="lg">
        <SectionHeading number={about.number} title={about.title} id="about-title" />

        <Grid gutter={{ base: 40, md: 64 }}>
          <Grid.Col span={{ base: 12, md: 5 }}>
            {photo && (
              <Box
                className="about-photo"
                data-testid="about-photo-box"
                data-vision-mode={visionMode}
                style={{
                  position: 'relative',
                  aspectRatio: '4 / 5',
                  maxWidth: 380,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: gradient.surfaceBg,
                  boxShadow: `0 18px 42px -12px ${gradient.primary.replace('rgb(', 'rgba(').replace(')', ', 0.35)')}`,
                }}>
                <Image src={photo} alt={about.photo.alt || ''} fill sizes="(max-width: 992px) 90vw, 380px" style={{ objectFit: 'cover' }} />

                {filteredSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filteredSrc}
                    alt=""
                    aria-hidden="true"
                    data-testid="about-photo-filtered"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                <Box
                  role="group"
                  aria-label="Filtre de vision par ordinateur"
                  data-testid="about-vision-controls"
                  style={{
                    position: 'absolute',
                    left: 10,
                    right: 10,
                    bottom: 10,
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 4,
                    padding: '5px 8px',
                    borderRadius: 999,
                    backgroundColor: '#0c0909',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.45)',
                  }}>
                  <Group gap={5} wrap="nowrap" pl={4}>
                    <IconEyeSpark size={14} color="#ff8f8a" aria-hidden="true" />
                    <Text component="span" ff="monospace" fz={10} fw={700} tt="uppercase" style={{ color: '#ffffff', letterSpacing: 0.8 }}>
                      Lena.js
                    </Text>
                  </Group>
                  <Group gap={4} wrap="nowrap">
                    {VISION_MODES.map(mode => {
                      const active = visionMode === mode.id;
                      return (
                        <UnstyledButton
                          key={mode.id}
                          type="button"
                          data-testid={`vision-mode-${mode.id}`}
                          aria-pressed={active}
                          onClick={() => setVisionMode(mode.id)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: active ? 700 : 500,
                            color: '#ffffff',
                            backgroundColor: active ? '#a90504' : 'transparent',
                            border: active ? '1px solid #ff8f8a' : '1px solid transparent',
                            transition: 'background-color 0.15s ease, border-color 0.15s ease',
                          }}>
                          {mode.label}
                        </UnstyledButton>
                      );
                    })}
                  </Group>
                </Box>
              </Box>
            )}
            <Text mt="xl" fz="md" lh={1.7} maw={460}>
              {about.bio}
            </Text>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg" data-testid="about-groups">
              {(about.groups || []).map(group => (
                <Box key={group.title}>
                  <Text component="h3" fz="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: 1.5, margin: 0 }} mb="xs">
                    {group.title}
                  </Text>
                  <Group gap={8} component="ul" className="list-reset" aria-label={group.title}>
                    {group.items.map(item => (
                      <li key={item} className="about-tag">
                        {item}
                      </li>
                    ))}
                  </Group>
                </Box>
              ))}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}

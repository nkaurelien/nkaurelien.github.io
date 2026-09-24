'use client';

import Image from 'next/image';
import { Container, Text, Group, Box, Grid, Stack } from '@mantine/core';
import SectionHeading from './SectionHeading';

// « 01. À propos » (inspiré de jev.dev) : photo + courte bio à gauche, compétences
// regroupées en étiquettes à droite. Suit le hero, qui ne montre plus la photo.
export default function AboutIntro({ about }) {
  if (!about) return null;
  const photo = about.photo?.url ? `/${about.photo.url.replace(/^\//, '')}` : null;

  return (
    <Box component="section" id="about" aria-labelledby="about-title" data-testid="about-intro" className="hero-dots-soft" py={{ base: 90, md: 110 }}>
      <Container size="lg">
        <SectionHeading number={about.number} title={about.title} id="about-title" />

        <Grid gutter={{ base: 40, md: 64 }}>
          <Grid.Col span={{ base: 12, md: 5 }}>
            {photo && (
              <Box
                className="about-photo"
                style={{ position: 'relative', aspectRatio: '4 / 5', maxWidth: 380, borderRadius: 16, overflow: 'hidden' }}>
                <Image src={photo} alt={about.photo.alt || ''} fill sizes="(max-width: 992px) 90vw, 380px" style={{ objectFit: 'cover' }} />
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

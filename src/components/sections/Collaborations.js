'use client';

import { useRef } from 'react';
import { Container, Text, SimpleGrid, Card, Avatar, Group, Stack, ThemeIcon } from '@mantine/core';
import { IconBrandLinkedin, IconBrandBehance, IconBrandGithub, IconBrandGitlab, IconWorld } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import gsap from '@/lib/gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionHeading from './SectionHeading';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Choisit l'icone selon la plateforme du lien (gris discret, rouge au survol de la carte :
// plus de couleurs de marque, qui juraient avec la charte en mode sombre).
function linkIcon(url = '') {
  const u = url.toLowerCase();
  if (u.includes('behance')) return IconBrandBehance;
  if (u.includes('linkedin')) return IconBrandLinkedin;
  if (u.includes('github')) return IconBrandGithub;
  if (u.includes('gitlab')) return IconBrandGitlab;
  return IconWorld;
}

export default function Collaborations({ collaborators, number }) {
  const containerRef = useRef(null);
  const items = (collaborators?.items || []).filter(i => i.active !== false);

  useGSAP(
    () => {
      gsap.from('.collab-title, .collab-subtitle', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
      });

      gsap.from('.collab-card', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      });
    },
    { scope: containerRef }
  );

  if (items.length === 0) return null;

  return (
    <Container component="section" ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
      <SectionHeading
        number={number}
        title={collaborators?.title || 'Collaborations'}
        subtitle={collaborators?.subtitle}
        titleClassName="collab-title"
        subtitleClassName="collab-subtitle"
      />

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {items.map(item => {
          const Icon = linkIcon(item.link);
          return (
            <Card
              key={item.name}
              className="collab-card"
              component="a"
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              withBorder
              radius="lg"
              padding="lg"
              shadow="sm">
              <Group wrap="nowrap" justify="space-between">
                <Group wrap="nowrap">
                  <Avatar src={item.image ? withBase(item.image) : undefined} alt="" name={item.name} color="brand" radius="xl" size="md" />
                  <Stack gap={0}>
                    <Text fw={700} fz="sm" lineClamp={1}>
                      {item.name}
                    </Text>
                    <Text c="dimmed" fz="xs" lineClamp={2}>
                      {item.role}
                    </Text>
                  </Stack>
                </Group>
                <ThemeIcon variant="subtle" color="gray" size="md" className="collab-link-icon">
                  <Icon size={20} aria-hidden="true" />
                </ThemeIcon>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}

'use client';

import { useRef } from 'react';
import { Container, Title, Text, SimpleGrid, Card, Avatar, Group, Stack, ThemeIcon } from '@mantine/core';
import { IconBrandLinkedin, IconBrandBehance, IconBrandGithub, IconBrandGitlab, IconWorld } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Choisit l'icone selon la plateforme du lien.
function linkMeta(url = '') {
  const u = url.toLowerCase();
  if (u.includes('behance')) return { Icon: IconBrandBehance, color: 'indigo' };
  if (u.includes('linkedin')) return { Icon: IconBrandLinkedin, color: 'blue' };
  if (u.includes('github')) return { Icon: IconBrandGithub, color: 'dark' };
  if (u.includes('gitlab')) return { Icon: IconBrandGitlab, color: 'orange' };
  return { Icon: IconWorld, color: 'gray' };
}

export default function Collaborations({ collaborators }) {
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
      <Title className="collab-title" order={2} ta="center">
        {collaborators?.title || 'Collaborations'}
      </Title>
      {collaborators?.subtitle && (
        <Text className="collab-subtitle" ta="center" c="dimmed" mt="xs" mb="xl">
          {collaborators.subtitle}
        </Text>
      )}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {items.map(item => {
          const { Icon, color } = linkMeta(item.link);
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
                  <Avatar src={item.image ? withBase(item.image) : undefined} name={item.name} color="brand" radius="xl" size="md" />
                  <Stack gap={0}>
                    <Text fw={700} fz="sm" lineClamp={1}>
                      {item.name}
                    </Text>
                    <Text c="dimmed" fz="xs" lineClamp={2}>
                      {item.role}
                    </Text>
                  </Stack>
                </Group>
                <ThemeIcon variant="subtle" color={color} size="md">
                  <Icon size={20} />
                </ThemeIcon>
              </Group>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}

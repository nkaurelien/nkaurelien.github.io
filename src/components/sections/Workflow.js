'use client';

import { useRef } from 'react';
import { Container, Title, Text, SimpleGrid, Card, Stack, Group, ThemeIcon } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Workflow({ workflow }) {
  const containerRef = useRef(null);
  const groups = (workflow?.groups || []).filter(g => g.active !== false);

  useGSAP(
    () => {
      gsap.from('.workflow-title, .workflow-subtitle', {
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

      gsap.from('.workflow-card', {
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

  if (groups.length === 0) return null;

  return (
    <Container component="section" ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
      <Title className="workflow-title" order={2} ta="center">
        {workflow?.title || 'Environnement & rituels'}
      </Title>
      {workflow?.subtitle && (
        <Text className="workflow-subtitle" ta="center" c="dimmed" mt="xs" mb="xl">
          {workflow.subtitle}
        </Text>
      )}
      {!workflow?.subtitle && <div style={{ marginBottom: 'var(--mantine-spacing-xl)' }} />}

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {groups.map(group => (
          <Card className="workflow-card" component="article" key={group.title} withBorder radius="lg" padding="lg" shadow="sm">
            <Text fw={700} mb="md">
              {group.title}
            </Text>
            <Stack gap="xs">
              {(group.items || []).map(item => (
                <Group key={item} gap="xs" wrap="nowrap" align="center">
                  <ThemeIcon size={20} radius="xl" variant="light" color="brand">
                    <IconCheck size={12} />
                  </ThemeIcon>
                  <Text fz="sm">{item}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
}

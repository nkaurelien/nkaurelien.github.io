'use client';

import { useRef } from 'react';
import { Container, Title, SimpleGrid, Card, Text, ThemeIcon } from '@mantine/core';
import { IconCode, IconServerCog, IconRobot, IconSparkles, IconActivityHeartbeat, IconSitemap, IconSchool, IconStar } from '@tabler/icons-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const ICONS = {
  code: IconCode,
  devops: IconServerCog,
  ai: IconRobot,
  aidev: IconSparkles,
  iot: IconActivityHeartbeat,
  architecture: IconSitemap,
  training: IconSchool,
};

export default function Services({ services }) {
  const items = (services?.items || []).filter(i => i.active !== false);
  const containerRef = useRef(null);

  useGSAP(
    () => {
      gsap.from('.service-card', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });
    },
    { scope: containerRef }
  );

  return (
    <Container ref={containerRef} size="lg" py={64}>
      <Title order={2} ta="center">
        {services?.title || 'Mes Services'}
      </Title>
      {services?.subtitle && (
        <Text ta="center" c="dimmed" mt="xs" mb="xl" maw={720} mx="auto">
          {services.subtitle}
        </Text>
      )}
      {!services?.subtitle && <div style={{ marginBottom: 'var(--mantine-spacing-xl)' }} />}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {items.map(item => {
          const Icon = ICONS[item.icon] || IconStar;
          return (
            <Card key={item.title} withBorder radius="lg" padding="xl" shadow="sm" className="service-card">
              <ThemeIcon size={54} radius="md" variant="light" color="brand" mb="md">
                <Icon size={28} />
              </ThemeIcon>
              <Text fw={700} fz="lg" mb="xs">
                {item.title}
              </Text>
              <Text c="dimmed" fz="sm">
                {item.text}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
    </Container>
  );
}

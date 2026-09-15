'use client';

import { useRef } from 'react';
import { Container, Title, SimpleGrid, Card, Text, ThemeIcon, Box } from '@mantine/core';
import { IconCode, IconServerCog, IconRobot, IconSparkles, IconActivityHeartbeat, IconSitemap, IconSchool, IconStar } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
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

  const bgImageUrl = withBase('/img/logos/generated_picsvp_com/Gemini_Generated_Image_ms4bthms4bthms4b.webp');

  return (
    <Box
      component="section"
      ref={containerRef}
      py={{ base: 60, sm: 80, md: 100 }}
      style={{
        position: 'relative',
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.88)), url(${bgImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'scroll',
      }}>
      <Container size="lg">
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
              <Card
                key={item.title}
                component="article"
                withBorder
                radius="lg"
                padding="xl"
                shadow="sm"
                className="service-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.10)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}>
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
    </Box>
  );
}

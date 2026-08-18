'use client';

import { useRef } from 'react';
import { Container, Title, Text, SimpleGrid, Card, Badge, Group } from '@mantine/core';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, stagger } from 'animejs';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Skills({ skills }) {
  const containerRef = useRef(null);
  const groups = (skills?.groups || []).filter(g => g.active !== false);

  useGSAP(
    () => {
      gsap.from('.skills-title, .skills-subtitle', {
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

      gsap.from('.skills-card', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
          onEnter: () => {
            // Subtle Anime.js entrance stagger
            const badges = containerRef.current?.querySelectorAll('.anime-skill-badge');
            if (badges && badges.length > 0) {
              animate(badges, {
                translateY: [6, 0],
                opacity: [0, 1],
                delay: stagger(30),
                duration: 450,
                ease: 'outCubic',
              });
            }
          },
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

  const handleBadgeHover = e => {
    animate(e.currentTarget, {
      translateY: [0, -2, 0],
      scale: [1, 1.04, 1],
      duration: 350,
      ease: 'outQuad',
    });
  };

  if (groups.length === 0) return null;

  return (
    <section className="section-muted">
      <Container ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
        <Title className="skills-title" order={2} ta="center">
          {skills?.title || 'Compétences'}
        </Title>
        {skills?.subtitle && (
          <Text className="skills-subtitle" ta="center" c="dimmed" mt="xs" mb="xl">
            {skills.subtitle}
          </Text>
        )}
        {!skills?.subtitle && <div style={{ marginBottom: 'var(--mantine-spacing-xl)' }} />}

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {groups.map(group => (
            <Card className="skills-card" component="article" key={group.title} withBorder radius="lg" padding="lg" shadow="sm">
              <Text fw={700} mb="sm">
                {group.title}
              </Text>
              <Group gap="xs">
                {(group.items || []).map(tech => (
                  <Badge
                    key={tech}
                    className="anime-skill-badge"
                    variant="light"
                    color="brand"
                    radius="sm"
                    size="md"
                    onMouseEnter={handleBadgeHover}
                    style={{ cursor: 'pointer', display: 'inline-block', transition: 'all 0.2s ease' }}>
                    {tech}
                  </Badge>
                ))}
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </section>
  );
}

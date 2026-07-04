'use client';

import { useRef } from 'react';
import { Container, Title, SimpleGrid, Card, Avatar, Text, Group, Stack, ActionIcon } from '@mantine/core';
import { IconStarFilled, IconStar, IconBrandLinkedin, IconQuote } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function Stars({ rating = 5 }) {
  return (
    <Group gap={2}>
      {Array.from({ length: 5 }).map((_, i) =>
        i < rating ? (
          <IconStarFilled key={i} size={16} color="var(--mantine-color-yellow-6)" />
        ) : (
          <IconStar key={i} size={16} color="var(--mantine-color-gray-4)" />
        )
      )}
    </Group>
  );
}

export default function Testimonials({ testimonials }) {
  const containerRef = useRef(null);
  const items = (testimonials?.items || []).filter(t => t.active !== false && (t.text || '').trim().length > 0);

  useGSAP(
    () => {
      gsap.from('.testimonials-title', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power2.out',
      });

      gsap.from('.testimonials-card', {
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
    <div className="section-muted">
      <Container ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
        <Title className="testimonials-title" order={2} ta="center" mb="xl">
          {testimonials?.title || 'Recommandations'}
        </Title>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {items.map(item => (
            <Card className="testimonials-card" key={item.name} withBorder radius="lg" padding="lg" shadow="sm">
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Group wrap="nowrap">
                  <Avatar src={item.image ? withBase(item.image) : undefined} name={item.name} color="brand" radius="xl" size="lg" />
                  <Stack gap={0}>
                    <Text fw={700} fz="sm" lineClamp={1}>
                      {item.name}
                    </Text>
                    <Text c="dimmed" fz="xs" lineClamp={2}>
                      {item.role}
                    </Text>
                  </Stack>
                </Group>
                {item.link && (
                  <ActionIcon
                    component="a"
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="subtle"
                    color="blue"
                    aria-label={`LinkedIn — ${item.name}`}>
                    <IconBrandLinkedin size={20} />
                  </ActionIcon>
                )}
              </Group>

              <Stars rating={item.rating} />

              <Text c="dimmed" fz="sm" mt="sm" style={{ position: 'relative' }}>
                <IconQuote size={18} style={{ opacity: 0.25, marginRight: 4, verticalAlign: 'text-top' }} />
                {item.text}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </div>
  );
}

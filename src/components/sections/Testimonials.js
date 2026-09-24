'use client';

import { useRef } from 'react';
import { Container, SimpleGrid, Card, Avatar, Text, Group, Stack, ActionIcon } from '@mantine/core';
import { IconStarFilled, IconStar, IconBrandLinkedin, IconQuote } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import gsap from '@/lib/gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SectionHeading from './SectionHeading';

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

export default function Testimonials({ testimonials, number }) {
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
    <section className="section-muted">
      <Container ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
        <SectionHeading number={number} title={testimonials?.title || 'Recommandations'} titleClassName="testimonials-title" />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl">
          {items.map((item, idx) => {
            const rot = [-1.8, 1.5, -1.3, 1.7, -1.5, 1.4][idx % 6];
            return (
              <Card
                className="testimonials-card"
                component="article"
                key={item.name}
                withBorder
                radius="lg"
                padding="lg"
                shadow="sm"
                style={{
                  transform: `rotate(${rot}deg)`,
                  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, z-index 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'rotate(0deg) translateY(-8px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.zIndex = '10';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = `rotate(${rot}deg)`;
                  e.currentTarget.style.boxShadow = '';
                  e.currentTarget.style.zIndex = '1';
                }}>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group wrap="nowrap">
                    <Avatar src={item.image ? withBase(item.image) : undefined} alt="" name={item.name} color="brand" radius="xl" size="lg" />
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
                      color="kamit"
                      aria-label={`LinkedIn — ${item.name}`}>
                      <IconBrandLinkedin size={20} aria-hidden="true" />
                    </ActionIcon>
                  )}
                </Group>

                <Stars rating={item.rating} />

                <Text c="dimmed" fz="sm" mt="sm" style={{ position: 'relative' }}>
                  <IconQuote size={18} style={{ opacity: 0.25, marginRight: 4, verticalAlign: 'text-top' }} />
                  {item.text}
                </Text>
              </Card>
            );
          })}
        </SimpleGrid>
      </Container>
    </section>
  );
}

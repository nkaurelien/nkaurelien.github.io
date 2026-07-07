'use client';

import { useRef } from 'react';
import { Container, SimpleGrid, Stack, Text } from '@mantine/core';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Counters({ counters }) {
  const containerRef = useRef(null);
  const items = (counters?.items || []).filter(i => i.active !== false);

  useGSAP(
    () => {
      gsap.from('.counter-stack', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        scale: 0.8,
        y: 20,
        duration: 0.8,
        stagger: 0.15,
        ease: 'back.out(1.5)',
      });
    },
    { scope: containerRef }
  );

  return (
    <section className="section-muted">
      <Container ref={containerRef} size="lg" py={56} style={{ overflow: 'hidden' }}>
        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="xl">
          {items.map(item => (
            <Stack className="counter-stack" key={item.label} gap={4} align="center">
              <Text fz={44} fw={800} c="brand.6">
                {item.value}
                {item.valueAfter}
              </Text>
              <Text c="dimmed" fw={500}>
                {item.label}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </section>
  );
}

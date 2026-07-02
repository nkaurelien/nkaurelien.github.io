'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Title, Text, Button, Group, Box } from '@mantine/core';

function decode(str = '') {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<\/?i>/g, '');
}

export default function Hero({ locale, hero }) {
  const rotates = hero?.subtitle?.rotates || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (rotates.length < 2) return undefined;
    const id = setInterval(() => setIndex(i => (i + 1) % rotates.length), 2600);
    return () => clearInterval(id);
  }, [rotates.length]);

  return (
    <Box className="hero-gradient" c="white" py={80}>
      <Container size="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Box style={{ flex: '1 1 340px', maxWidth: 620 }}>
            <Title order={1} fz={{ base: 34, sm: 48 }} lh={1.1} dangerouslySetInnerHTML={{ __html: decode(hero?.title) }} />
            <Text mt="lg" fz={{ base: 18, sm: 22 }} fw={500} style={{ minHeight: 34 }}>
              <span style={{ opacity: 0.7 }}>{decode(hero?.subtitle?.start)}</span>
              {rotates[index]}
              <span style={{ opacity: 0.7 }}>{decode(hero?.subtitle?.end)}</span>
            </Text>
            {hero?.button && (
              <Button mt="xl" size="md" radius="xl" variant="white" c="brand.7" component={Link} href={`/${locale}${hero.button.link}`}>
                {hero.button.label}
              </Button>
            )}
          </Box>

          {hero?.photo?.url && (
            <Box style={{ flex: '0 0 auto' }}>
              <Image
                src={`/${hero.photo.url.replace(/^\//, '')}`}
                alt={hero.photo.alt || 'Aurelien NKUMBE'}
                width={320}
                height={320}
                style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
                priority
              />
            </Box>
          )}
        </Group>
      </Container>
    </Box>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Title, Text, Button, Group, Box, Badge } from '@mantine/core';
import { withBase } from '@/lib/asset';

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
    <Box
      className="hero-gradient"
      c="white"
      py={80}
      style={{
        backgroundImage: hero?.bg_image
          ? `linear-gradient(135deg, rgba(49, 46, 129, 0.85) 0%, rgba(79, 70, 229, 0.85) 55%, rgba(99, 102, 241, 0.85) 100%), url(${withBase(hero.bg_image)})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Container size="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Box style={{ flex: '1 1 340px', maxWidth: 620 }}>
            {hero?.badge && (
              <Badge
                size="lg"
                radius="sm"
                variant="white"
                c="teal.7"
                mb="md"
                leftSection={
                  <Box
                    component="span"
                    w={8}
                    h={8}
                    style={{ borderRadius: '50%', background: 'var(--mantine-color-teal-6)', display: 'inline-block' }}
                  />
                }>
                {hero.badge}
              </Badge>
            )}
            <Title order={1} fz={{ base: 34, sm: 48 }} lh={1.1} dangerouslySetInnerHTML={{ __html: decode(hero?.title) }} />
            <Text mt="lg" fz={{ base: 18, sm: 22 }} fw={500} style={{ minHeight: 34 }}>
              <span style={{ opacity: 0.7 }}>{decode(hero?.subtitle?.start)}</span>
              {rotates[index]}
              <span style={{ opacity: 0.7 }}>{decode(hero?.subtitle?.end)}</span>
            </Text>
            <Group mt="xl" gap="sm">
              {hero?.button && (
                <Button size="md" radius="xl" variant="white" c="brand.7" component={Link} href={`/${locale}${hero.button.link}`}>
                  {hero.button.label}
                </Button>
              )}
              <Button size="md" radius="xl" variant="outline" color="white" component={Link} href={`/${locale}/contact`}>
                {locale === 'en' ? 'Contact me' : 'Me contacter'}
              </Button>
            </Group>
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

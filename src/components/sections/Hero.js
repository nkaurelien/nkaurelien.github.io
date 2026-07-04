'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Title, Text, Button, Group, Box, Badge } from '@mantine/core';

function decode(str = '') {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<\/?i>/g, '');
}

function renderSubtitleContent(start, end, sentence) {
  if (!sentence) return null;
  const words = sentence.split(' ');

  if (words.length <= 1) {
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ opacity: 0.7 }}>{decode(start)}</span>
        {sentence}
        <span style={{ opacity: 0.7 }}>{decode(end)}</span>
      </span>
    );
  }

  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  const middleText = words.slice(1, -1).join(' ');

  return (
    <>
      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ opacity: 0.7 }}>{decode(start)}</span>
        {firstWord}
      </span>
      {middleText ? ` ${middleText} ` : ' '}
      <span style={{ whiteSpace: 'nowrap' }}>
        {lastWord}
        <span style={{ opacity: 0.7 }}>{decode(end)}</span>
      </span>
    </>
  );
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
            <Text mt="lg" fz={{ base: 18, sm: 22 }} fw={500} mih={{ base: 90, xs: 70, sm: 45 }} style={{ lineHeight: '1.4' }}>
              <span key={index} className="rotate-text-anim">
                {renderSubtitleContent(hero?.subtitle?.start, hero?.subtitle?.end, rotates[index])}
              </span>
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
            <Box
              className="hero-photo-container"
              style={{
                flex: '0 0 auto',
                position: 'relative',
                display: 'inline-block',
                borderRadius: '32px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: 'var(--mantine-shadow-xl)',
              }}>
              {/* Radial glow glow behind the photo */}
              <Box
                style={{
                  position: 'absolute',
                  top: '-15%',
                  left: '-15%',
                  right: '-15%',
                  bottom: '-15%',
                  background: 'radial-gradient(circle, rgba(129, 140, 248, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
                  filter: 'blur(20px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />

              <Box
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                  display: 'block',
                  lineHeight: 0,
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                }}>
                <Image
                  src={`/${hero.photo.url.replace(/^\//, '')}`}
                  alt={hero.photo.alt || 'Aurelien NKUMBE'}
                  width={280}
                  height={280}
                  className="hero-photo-img"
                  style={{
                    objectFit: 'cover',
                    maxWidth: '100%',
                    height: 'auto',
                    transition: 'transform 0.5s ease',
                    display: 'block',
                  }}
                  priority
                />
              </Box>
            </Box>
          )}
        </Group>
      </Container>
    </Box>
  );
}

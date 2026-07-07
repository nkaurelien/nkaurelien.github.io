'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Title, Text, Button, Group, Box, Badge } from '@mantine/core';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

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
  const containerRef = useRef(null);

  useEffect(() => {
    if (rotates.length < 2) return undefined;
    const id = setInterval(() => setIndex(i => (i + 1) % rotates.length), 2600);
    return () => clearInterval(id);
  }, [rotates.length]);

  useGSAP(
    () => {
      if (typeof window === 'undefined') return undefined;

      let photoEl;
      let handlePhotoMouseEnter;

      // 1. Dynamically import mo.js
      import('@mojs/core')
        .then(mojsModule => {
          const mojs = mojsModule.default;

          photoEl = containerRef.current?.querySelector('.hero-photo-container');
          if (photoEl) {
            const offsets = [
              { left: '50%', top: '0%' },
              { left: '85%', top: '15%' },
              { left: '100%', top: '50%' },
              { left: '85%', top: '85%' },
              { left: '50%', top: '100%' },
              { left: '15%', top: '85%' },
              { left: '0%', top: '50%' },
              { left: '15%', top: '15%' },
            ];

            const photoBursts = offsets.map(offset => {
              return new mojs.Burst({
                parent: photoEl,
                left: offset.left,
                top: offset.top,
                radius: { 0: 30 },
                count: 5,
                angle: { 0: 45 },
                children: {
                  shape: 'circle',
                  radius: 4,
                  fill: ['#988ADE', '#DE8AA0', '#8AAEDE', '#8ADEAD', '#DEC58A', '#8AD1DE'],
                  duration: 800,
                  delay: 'rand(0, 200)',
                  easing: 'cubic.out',
                },
              });
            });

            handlePhotoMouseEnter = () => {
              photoBursts.forEach(b => b.replay());
            };

            photoEl.addEventListener('mouseenter', handlePhotoMouseEnter);
          }
        })
        .catch(err => console.error('Failed to load mojs in Hero:', err));

      // 2. Play page entry timeline using GSAP
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo('.hero-badge', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.hero-title', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.45')
        .fromTo('.hero-subtitle', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.55')
        .fromTo('.hero-btn', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.45')
        .fromTo(
          '.hero-photo-wrapper',
          { x: 40, scale: 0.96, opacity: 0 },
          { x: 0, scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.2)' },
          '-=0.65'
        );

      // Cleanup
      return () => {
        if (photoEl && handlePhotoMouseEnter) {
          photoEl.removeEventListener('mouseenter', handlePhotoMouseEnter);
        }
      };
    },
    { scope: containerRef }
  );

  return (
    <Box ref={containerRef} className="hero-gradient" c="white" py={80} style={{ overflow: 'hidden' }}>
      <Container size="lg">
        <Group justify="space-between" align="center" wrap="wrap">
          <Box style={{ flex: '1 1 340px', maxWidth: 620 }}>
            {hero?.badge && (
              <Box mb="md">
                <Badge
                  className="hero-badge"
                  size="lg"
                  radius="sm"
                  variant="white"
                  c="teal.7"
                  mb={hero?.badge_detail ? 6 : 0}
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
                {hero?.badge_detail && (
                  <Text
                    size="xs"
                    c="rgba(255, 255, 255, 0.8)"
                    style={{ letterSpacing: 0.5, fontWeight: 500, display: 'block' }}
                    className="hero-badge-detail">
                    {hero.badge_detail}
                  </Text>
                )}
              </Box>
            )}
            <Title className="hero-title" order={1} fz={{ base: 34, sm: 48 }} lh={1.1} dangerouslySetInnerHTML={{ __html: decode(hero?.title) }} />
            <Text
              className="hero-subtitle"
              mt="lg"
              fz={{ base: 18, sm: 22 }}
              fw={500}
              mih={{ base: 90, xs: 70, sm: 45 }}
              style={{ lineHeight: '1.4' }}>
              <span key={index} className="rotate-text-anim">
                {renderSubtitleContent(hero?.subtitle?.start, hero?.subtitle?.end, rotates[index])}
              </span>
            </Text>
            <Group mt="xl" gap="sm">
              {hero?.button && (
                <Button
                  className="hero-btn"
                  size="md"
                  radius="xl"
                  variant="white"
                  c="brand.7"
                  component={Link}
                  href={`/${locale}${hero.button.link}`}>
                  {hero.button.label}
                </Button>
              )}
              <Button className="hero-btn" size="md" radius="xl" variant="outline" color="white" component={Link} href={`/${locale}/contact`}>
                {locale === 'en' ? 'Contact me' : 'Me contacter'}
              </Button>
            </Group>
          </Box>

          {hero?.photo?.url && (
            <Box
              className="hero-photo-container hero-photo-wrapper"
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

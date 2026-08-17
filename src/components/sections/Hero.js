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
    <Box component="section" ref={containerRef} className="hero-gradient" c="white" py={80} style={{ overflow: 'hidden' }}>
      <Container size="lg">
        <Group justify={{ base: 'center', md: 'space-between' }} align="center" wrap="wrap" className="hero-parent-group">
          <Box style={{ flex: '1 1 340px', maxWidth: 620 }}>
            {hero?.badge && (
              <Group gap="sm" mb="md" className="hero-badge-group" justify={{ base: 'center', md: 'flex-start' }}>
                <Badge
                  className="hero-badge"
                  size="lg"
                  radius="sm"
                  variant="white"
                  c="teal.7"
                  leftSection={<span className="status-dot-pulse" />}
                  styles={{
                    root: {
                      height: 28,
                      paddingLeft: 10,
                      paddingRight: 10,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    },
                    inner: {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      letterSpacing: 0.2,
                    },
                  }}>
                  {hero.badge}
                </Badge>
                {hero?.badge_detail && (
                  <Badge
                    className="hero-badge-detail"
                    size="lg"
                    radius="sm"
                    variant="outline"
                    color="white"
                    leftSection={<span style={{ marginRight: 2 }}>📍</span>}
                    styles={{
                      root: {
                        height: 28,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        paddingLeft: 10,
                        paddingRight: 10,
                      },
                      inner: {
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        letterSpacing: 0.2,
                      },
                    }}>
                    {hero.badge_detail}
                  </Badge>
                )}
              </Group>
            )}
            <Title
              className="hero-title"
              order={1}
              fz={{ base: 34, sm: 48 }}
              lh={1.1}
              ta={{ base: 'center', md: 'left' }}
              dangerouslySetInnerHTML={{ __html: decode(hero?.title) }}
            />
            <Text
              className="hero-subtitle"
              mt="lg"
              fz={{ base: 18, sm: 22 }}
              fw={500}
              mih={{ base: 90, xs: 70, sm: 45 }}
              ta={{ base: 'center', md: 'left' }}
              style={{ lineHeight: '1.4' }}>
              <span key={index} className="rotate-text-anim">
                {renderSubtitleContent(hero?.subtitle?.start, hero?.subtitle?.end, rotates[index])}
              </span>
            </Text>
            <Group mt="xl" gap="sm" justify={{ base: 'center', md: 'flex-start' }} className="hero-buttons-group">
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

            {/* Rangée de badges de Stack Technique */}
            <Group mt="lg" gap={6} justify={{ base: 'center', md: 'flex-start' }} className="hero-tech-pills">
              {['FastAPI', 'Next.js 15', 'React', 'Python', 'DevSecOps', 'Docker', 'Laravel'].map(tech => (
                <Badge
                  key={tech}
                  size="sm"
                  radius="xl"
                  variant="filled"
                  color="rgba(255, 255, 255, 0.12)"
                  style={{
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(4px)',
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                  }}>
                  {tech}
                </Badge>
              ))}
            </Group>

            {/* Métriques d'impact percutantes */}
            <Group mt="xl" gap="xl" justify={{ base: 'center', md: 'flex-start' }} className="hero-metrics">
              <Box>
                <Text fw={800} fz={{ base: 22, sm: 26 }} c="white" style={{ lineHeight: 1 }}>
                  7+
                </Text>
                <Text size="xs" c="rgba(255, 255, 255, 0.75)" mt={2}>
                  {locale === 'en' ? 'Years Exp.' : "Ans d'expérience"}
                </Text>
              </Box>
              <Box style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: 16 }}>
                <Text fw={800} fz={{ base: 22, sm: 26 }} c="white" style={{ lineHeight: 1 }}>
                  20+
                </Text>
                <Text size="xs" c="rgba(255, 255, 255, 0.75)" mt={2}>
                  {locale === 'en' ? 'Projects Delivered' : 'Projets Web & IA'}
                </Text>
              </Box>
              <Box style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.2)', paddingLeft: 16 }}>
                <Text fw={800} fz={{ base: 22, sm: 26 }} c="white" style={{ lineHeight: 1 }}>
                  100k+
                </Text>
                <Text size="xs" c="rgba(255, 255, 255, 0.75)" mt={2}>
                  {locale === 'en' ? 'Users & Records' : 'Utilisateurs & Relevés'}
                </Text>
              </Box>
            </Group>
          </Box>

          {hero?.photo?.url && (
            <Box
              className="hero-photo-container hero-photo-wrapper"
              mx={{ base: 'auto', md: 0 }}
              mt={{ base: 'xl', md: 0 }}
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
              {/* Badge flottant 1: Senior Tech Lead */}
              <Box
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -16,
                  zIndex: 10,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
                }}>
                <Text size="xs" fw={700} c="teal.4" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>⚡</span> Senior Tech Lead
                </Text>
              </Box>

              {/* Badge flottant 2: Architecte IA & RAG */}
              <Box
                style={{
                  position: 'absolute',
                  bottom: -12,
                  left: -16,
                  zIndex: 10,
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)',
                }}>
                <Text size="xs" fw={700} c="cyan.4" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>🤖</span> Architecte IA & RAG
                </Text>
              </Box>

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

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Title, Text, Button, Group, Box, Badge, Stack } from '@mantine/core';
import CodeBanner from './CodeBanner';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import VantaWaveBackground from '../layout/VantaWaveBackground';
import anime from 'animejs';

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

      let badgeCleanupFns = [];

      // 1. Dynamically import mo.js pour les étincelles sur les étiquettes flottantes
      import('@mojs/core')
        .then(mojsModule => {
          const mojs = mojsModule.default;
          const badgeEls = containerRef.current?.querySelectorAll('.hero-floating-badge');

          if (badgeEls && badgeEls.length > 0) {
            badgeEls.forEach(badge => {
              const burst = new mojs.Burst({
                parent: badge,
                left: '50%',
                top: '50%',
                radius: { 0: 28 },
                count: 6,
                angle: { 0: 60 },
                children: {
                  shape: 'circle',
                  radius: 3.5,
                  fill: ['#34d399', '#22d3ee', '#818cf8', '#f43f5e', '#fbbf24'],
                  duration: 600,
                  delay: 'rand(0, 100)',
                  easing: 'cubic.out',
                },
              });

              const handleBadgeMouseEnter = () => burst.replay();
              badge.addEventListener('mouseenter', handleBadgeMouseEnter);
              badgeCleanupFns.push(() => badge.removeEventListener('mouseenter', handleBadgeMouseEnter));
            });
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
        badgeCleanupFns.forEach(cleanup => cleanup());
      };
    },
    { scope: containerRef }
  );

  return (
    <Box
      component="section"
      ref={containerRef}
      className="hero-gradient"
      c="white"
      pt={{ base: 50, sm: 75, md: 95 }}
      pb={{ base: 70, sm: 105, md: 135 }}
      style={{ overflow: 'hidden', position: 'relative' }}>
      <VantaWaveBackground
        effectType="fog"
        highlightColor="#ff6f0f"
        midtoneColor="#ff5032"
        lowlightColor="#463b72"
        baseColor="#1e1b4b"
        speed={1.2}
        zoom={0.95}
        opacity={0.85}
      />
      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <Group justify={{ base: 'center', md: 'space-between' }} align="center" wrap="wrap" className="hero-parent-group" w="100%">
          <Box style={{ flex: '1 1 340px', maxWidth: 600 }}>
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
            <Stack gap="md" align={{ base: 'center', md: 'flex-start' }}>
              <Title
                className="hero-title"
                order={1}
                fz={{ base: 34, sm: 46 }}
                lh={1.15}
                ta={{ base: 'center', md: 'left' }}
                dangerouslySetInnerHTML={{ __html: decode(hero?.title) }}
              />

              <Group mt="xs" gap="sm" justify={{ base: 'center', md: 'flex-start' }} className="hero-buttons-group">
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

              {/* Métriques d'impact percutantes */}
              <Group mt="sm" gap="xl" justify={{ base: 'center', md: 'flex-start' }} className="hero-metrics">
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

              {/* Écosystème & Stack de Confiance (Style SkyMedia : Petits badges rectangles discrets) */}
              <Box mt="xs" pt="xs" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', width: '100%' }}>
                <Text size="xs" fw={600} c="rgba(255, 255, 255, 0.65)" tt="uppercase" style={{ letterSpacing: 0.8 }} mb={6}>
                  {locale === 'en' ? 'Core Ecosystem' : 'Écosystème & Stack de Confiance'}
                </Text>
                <Group gap="xs" align="center" wrap="wrap" justify={{ base: 'center', md: 'flex-start' }}>
                  {['🤖 Claude IA', '⚙️ SpecKit', '⚛️ Next.js 15', '🅰️ Angular', '🔴 Laravel', '⚡ REST API', '⚡ FastAPI', '🔐 OAuth2', '🔒 DevSecOps', '🐳 Docker', '🦊 GitLab CI', '🧱 Terraform'].map(partner => (
                    <Text
                      key={partner}
                      size="xs"
                      fw={600}
                      c="rgba(255, 255, 255, 0.9)"
                      onMouseEnter={e => {
                        anime({
                          targets: e.currentTarget,
                          scale: [1, 1.15, 1],
                          translateY: [0, -3, 0],
                          duration: 600,
                          easing: 'spring(1, 90, 10, 0)',
                        });
                      }}
                      style={{
                        padding: '3px 9px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        display: 'inline-block',
                      }}>
                      {partner}
                    </Text>
                  ))}
                </Group>
              </Box>
            </Stack>
          </Box>

          {hero?.photo?.url && (
            <Box
              className="hero-photo-container hero-photo-wrapper"
              ml={{ base: 'auto', md: 'auto' }}
              mr={{ base: 'auto', md: 0 }}
              mt={{ base: 'xl', md: 0 }}
              style={{
                flex: '0 0 auto',
                position: 'relative',
                display: 'inline-block',
              }}>
              {/* Badge flottant 1: Senior Fullstack Engineer */}
              <Box
                className="hero-floating-badge"
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  zIndex: 10,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                <Text size="xs" fw={700} c="teal.4" style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                  <span>⚡</span> Senior Fullstack Engineer
                </Text>
              </Box>

              {/* Badge flottant 2: Fullstack & AI Engineer */}
              <Box
                className="hero-floating-badge"
                style={{
                  position: 'absolute',
                  bottom: -12,
                  left: -12,
                  zIndex: 10,
                  background: 'rgba(15, 23, 42, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  borderRadius: '16px',
                  padding: '6px 14px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                <Text size="xs" fw={700} c="cyan.4" style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                  <span>🚀</span> Fullstack & AI Engineer
                </Text>
              </Box>

              {/* Halo d'ambiance diffus en arrière-plan */}
              <Box
                style={{
                  position: 'absolute',
                  top: '-8%',
                  left: '-8%',
                  right: '-8%',
                  bottom: '-8%',
                  background: 'radial-gradient(circle, rgba(129, 140, 248, 0.45) 0%, rgba(99, 102, 241, 0) 70%)',
                  filter: 'blur(20px)',
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              />

              {/* Photo Épurée Sans Cadre (Intégration directe avec ombre profonde) */}
              <Box
                style={{
                  borderRadius: '24px',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                  display: 'block',
                  lineHeight: 0,
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 32px 75px -12px rgba(0, 0, 0, 0.65), 0 12px 30px -8px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
                }}>
                <Image
                  src={`/${hero.photo.url.replace(/^\//, '')}`}
                  alt={hero.photo.alt || 'Aurelien NKUMBE'}
                  width={290}
                  height={350}
                  className="hero-photo-img"
                  style={{
                    objectFit: 'cover',
                    maxWidth: '100%',
                    width: '290px',
                    height: '350px',
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

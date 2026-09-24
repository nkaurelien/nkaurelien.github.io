'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Container, Title, Text, Button, Group, Box } from '@mantine/core';
import { IconBrandGithub, IconFileText, IconMail, IconArrowRight } from '@tabler/icons-react';
import gsap from '@/lib/gsap';
import { useGSAP } from '@gsap/react';
import VantaWaveBackground from '../layout/VantaWaveBackground';

const GITHUB = 'https://github.com/nkaurelien';

// Hero épuré (inspiré de jev.dev) : accroche, nom en très grand, rôle @ société, phrase
// d'accroche et boutons « pilule ». La photo est présentée juste après, dans « À propos ».
export default function Hero({ locale, hero }) {
  const containerRef = useRef(null);
  const isEnglish = locale === 'en';

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .fromTo('.hero-eyebrow', { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
        .fromTo('.hero-title', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.3')
        .fromTo('.hero-role, .hero-tagline', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, '-=0.5')
        .fromTo('.hero-btn, .hero-status', { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, '-=0.4');
    },
    { scope: containerRef }
  );

  const pill = {
    root: {
      borderColor: 'rgba(255, 255, 255, 0.18)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      color: 'rgba(255, 255, 255, 0.85)',
      fontWeight: 500,
    },
  };

  return (
    <Box
      component="section"
      ref={containerRef}
      className="hero-gradient hero-dots"
      c="white"
      aria-labelledby="hero-title"
      data-testid="hero"
      pt={{ base: 90, sm: 130, md: 160 }}
      pb={{ base: 110, sm: 150, md: 180 }}
      style={{ overflow: 'hidden', position: 'relative' }}>
      <VantaWaveBackground
        effectType="fog"
        // Charte Kamitbrains, en sourdine : lueurs rouge sombre sur fond quasi noir,
        // pour laisser le nom (rouge → deep orange) ressortir.
        highlightColor="#7a0403"
        midtoneColor="#3d0201"
        lowlightColor="#1c0302"
        baseColor="#0c0909"
        speed={0.8}
        zoom={0.9}
        opacity={0.9}
      />
      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <Box maw={760}>
          <Text className="hero-eyebrow" ff="monospace" fz="sm" tt="uppercase" c="rgba(255, 255, 255, 0.6)" style={{ letterSpacing: 2 }} mb="md">
            {hero?.eyebrow || (isEnglish ? "Hi, I'm" : 'Bonjour, je suis')}
          </Text>

          <Title
            id="hero-title"
            className="hero-title"
            order={1}
            fz={{ base: 52, sm: 76, md: 96 }}
            fw={900}
            lh={1}
            style={{ letterSpacing: '-0.04em' }}>
            {hero?.first_name || 'Aurélien'} <span className="hero-name-accent">{hero?.last_name || 'NKUMBE'}</span>
          </Title>

          <Text className="hero-role" fz={{ base: 'lg', sm: 22 }} fw={500} mt="xl" c="white">
            {hero?.role}
            {hero?.company && (
              <>
                {' '}
                {/* Kamitbrains IT : ma propre structure (auto-entreprise), d'où « fondateur de » et non « @ ». */}
                <Text component="span" inherit c="rgba(255, 255, 255, 0.7)">
                  · {hero.company_label || (isEnglish ? 'founder of' : 'fondateur de')}{' '}
                </Text>
                <Link href={`/${locale}${hero.company_link || '/kamitbrains'}`} className="hero-company-link">
                  {hero.company}
                </Link>
              </>
            )}
          </Text>

          <Text className="hero-tagline" fz={{ base: 'md', sm: 'lg' }} mt={6} c="rgba(255, 255, 255, 0.65)">
            {hero?.tagline}
          </Text>

          <Group mt={36} gap="sm" className="hero-buttons-group">
            {hero?.button && (
              <Button
                className="hero-btn"
                radius="xl"
                color="kamit"
                component={Link}
                href={`/${locale}${hero.button.link}`}
                rightSection={<IconArrowRight size={16} aria-hidden="true" />}
                data-testid="hero-cta">
                {hero.button.label}
              </Button>
            )}
            <Button
              className="hero-btn"
              radius="xl"
              variant="outline"
              styles={pill}
              component="a"
              href={GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconBrandGithub size={16} aria-hidden="true" />}>
              GitHub
            </Button>
            <Button
              className="hero-btn"
              radius="xl"
              variant="outline"
              styles={pill}
              component="a"
              href="/cv.pdf"
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconFileText size={16} aria-hidden="true" />}>
              {isEnglish ? 'Resume' : 'CV'}
            </Button>
            <Button
              className="hero-btn"
              radius="xl"
              variant="outline"
              styles={pill}
              component={Link}
              href={`/${locale}/contact`}
              leftSection={<IconMail size={16} aria-hidden="true" />}>
              Contact
            </Button>
          </Group>

          {hero?.badge && (
            <Group className="hero-status" gap={8} mt="lg" wrap="nowrap">
              <span className="status-dot-pulse" aria-hidden="true" />
              <Text fz="sm" c="rgba(255, 255, 255, 0.7)">
                {hero.badge}
                {hero?.badge_detail ? ` · ${hero.badge_detail}` : ''}
              </Text>
            </Group>
          )}
        </Box>
      </Container>
    </Box>
  );
}

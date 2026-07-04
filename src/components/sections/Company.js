'use client';

import { useRef } from 'react';
import { Container, Title, Text, Button, Group, Box, Badge, SimpleGrid, Paper, Stack, ThemeIcon, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconExternalLink, IconBriefcase, IconPlayerPause } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Link from 'next/link';

function localizedHref(locale, link) {
  if (!link) return '';
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  return `/${locale}${link === '/' ? '' : link}` || `/${locale}`;
}

export default function Company({ company, locale }) {
  const burstRef = useRef(null);
  const containerRef = useRef(null);

  useGSAP(
    () => {
      if (typeof window === 'undefined') return undefined;

      let titleEl;
      let handleTitleMouseEnter;

      // 1. Load mo.js dynamically
      import('@mojs/core')
        .then(mojsModule => {
          const mojs = mojsModule.default;

          // Local checkmark hover burst instance
          burstRef.current = new mojs.Burst({
            left: 0,
            top: 0,
            radius: { 0: 24 },
            count: 5,
            angle: { 0: 30 },
            children: {
              shape: 'circle',
              radius: 3,
              fill: ['#6366f1', '#06b6d4', '#10b981'],
              strokeWidth: 0,
              duration: 400,
              easing: 'cubic.out',
            },
          });

          // Animocons Title multi-burst hover animation
          titleEl = containerRef.current?.querySelector('.company-title');
          if (titleEl) {
            const offsets = [
              { left: '10%', top: '-40%' },
              { left: '30%', top: '-70%' },
              { left: '55%', top: '-30%' },
              { left: '75%', top: '-60%' },
              { left: '95%', top: '-40%' },
              { left: '25%', top: '120%' },
              { left: '50%', top: '140%' },
              { left: '80%', top: '120%' },
            ];

            const titleBursts = offsets.map(offset => {
              return new mojs.Burst({
                parent: titleEl,
                left: offset.left,
                top: offset.top,
                radius: { 0: 25 },
                count: 5,
                angle: { 0: 45 },
                children: {
                  shape: 'circle',
                  radius: 3.5,
                  fill: ['#988ADE', '#DE8AA0', '#8AAEDE', '#8ADEAD', '#DEC58A', '#8AD1DE'],
                  duration: 700,
                  delay: 'rand(0, 180)',
                  easing: 'cubic.out',
                },
              });
            });

            handleTitleMouseEnter = () => {
              titleBursts.forEach(b => b.replay());
            };

            titleEl.addEventListener('mouseenter', handleTitleMouseEnter);
          }
        })
        .catch(err => console.error('Failed to load mojs in Company:', err));

      // 2. Play page entry timeline using GSAP
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo('.company-badge', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.company-title', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.45')
        .fromTo('.company-desc', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.55')
        .fromTo('.company-btns', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.5')
        .fromTo('.company-card', { scale: 0.96, y: 40, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 1, ease: 'back.out(1.1)' }, '-=0.6')
        .fromTo('.kamitbrains-list-item', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.5');

      // Cleanup
      return () => {
        if (titleEl && handleTitleMouseEnter) {
          titleEl.removeEventListener('mouseenter', handleTitleMouseEnter);
        }
      };
    },
    { scope: containerRef }
  );

  const triggerHoverBurst = e => {
    if (!burstRef.current) return;
    const iconEl = e.currentTarget.querySelector('.tabler-icon');
    if (!iconEl) return;

    const rect = iconEl.getBoundingClientRect();
    // Use clientX / clientY viewport coordinates since mo.js creates a fixed container
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    burstRef.current.tune({ x, y }).replay();
  };

  if (!company) return null;

  const items = company.items || [];
  const hasBg = !!company.bg_image;

  return (
    <Box
      ref={containerRef}
      className={hasBg ? undefined : 'section-muted'}
      py={80}
      c={hasBg ? 'white' : undefined}
      style={{
        backgroundImage: hasBg
          ? `linear-gradient(135deg, rgba(20, 21, 23, 0.90) 0%, rgba(49, 46, 129, 0.90) 100%), url(${withBase(company.bg_image)})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: 'calc(100vh - var(--header-height) - 130px)',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
      }}>
      <Container size="lg" style={{ width: '100%' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40} align="center">
          {/* Column 1: Logo & Company Description */}
          <Stack gap="lg" align="flex-start" style={{ textAlign: 'left' }}>
            {company.status === 'PAUSE' && (
              <Tooltip label={company.status_tooltip || 'Activité temporairement en pause'} position="top" withArrow>
                <Group
                  className="company-badge"
                  gap={6}
                  style={{
                    background: 'rgba(247, 103, 7, 0.2)',
                    backdropFilter: 'blur(4px)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(247, 103, 7, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'help',
                  }}>
                  <IconPlayerPause size={14} color="#f76707" style={{ fill: '#f76707' }} />
                  <Text fw={800} fz="xs" style={{ color: '#ff922b', letterSpacing: '1px', lineHeight: 1, textTransform: 'uppercase' }}>
                    {company.status_label || 'En pause'}
                  </Text>
                </Group>
              </Tooltip>
            )}

            <Group className={company.status === 'PAUSE' ? undefined : 'company-badge'} justify="flex-start">
              <Badge size="lg" radius="sm" variant={hasBg ? 'filled' : 'light'} color="indigo" leftSection={<IconBriefcase size={14} />}>
                {company.badge || 'Structure Freelance'}
              </Badge>
            </Group>

            <Title
              className="company-title"
              order={2}
              fz={{ base: 28, sm: 36 }}
              lh={1.2}
              style={{ textAlign: 'left', display: 'inline-block', cursor: 'default' }}>
              {company.title}
            </Title>

            <Text
              className="company-desc"
              fz="md"
              c={hasBg ? 'gray.3' : 'dimmed'}
              style={{ fontSize: '1.1rem', lineHeight: '1.6', textAlign: 'left', width: '100%' }}
              dangerouslySetInnerHTML={{ __html: company.description }}
            />

            <Group className="company-btns" gap="sm" mt="md" justify="flex-start">
              {company.button && (
                <Button
                  component="a"
                  href={company.button.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="md"
                  radius="xl"
                  variant="filled"
                  color={hasBg ? 'white' : 'indigo'}
                  c={hasBg ? 'indigo.8' : undefined}
                  rightSection={<IconExternalLink size={16} />}>
                  {company.button.label}
                </Button>
              )}
              {company.buttonProject && (
                <Button
                  component={Link}
                  href={localizedHref(locale, company.buttonProject.link)}
                  size="md"
                  radius="xl"
                  variant="outline"
                  color={hasBg ? 'white' : 'indigo'}>
                  {company.buttonProject.label}
                </Button>
              )}
            </Group>
          </Stack>

          {/* Column 2: Logo image and Core values */}
          <Paper
            className="company-card"
            withBorder
            radius="xl"
            p="xl"
            shadow="md"
            style={{
              background: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))',
              color: 'var(--mantine-color-text)',
              width: '100%',
            }}>
            <Stack gap="xl">
              {/* Logo display */}
              <Group justify="center" py="md">
                <Box
                  className="kamitbrains-logo-container"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px',
                    borderRadius: '50%',
                    background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={withBase(company.image || '/img/logos/kamitbrains.svg')}
                    alt={company.title}
                    style={{ height: '72px', width: 'auto', display: 'block' }}
                  />
                </Box>
              </Group>

              {/* Sell points */}
              <Stack gap="md">
                {items.map((item, idx) => (
                  <Group key={idx} wrap="nowrap" align="flex-start" gap="md" className="kamitbrains-list-item" onMouseEnter={triggerHoverBurst}>
                    <ThemeIcon size={28} radius="xl" variant="light" color="indigo" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <IconCircleCheck size={18} />
                    </ThemeIcon>
                    <Box style={{ flex: 1, textAlign: 'left' }}>
                      <Text fw={700} fz="md" mb={2} style={{ color: 'var(--mantine-color-text)', textAlign: 'left' }}>
                        {item.title}
                      </Text>
                      <Text fz="sm" c="dimmed" style={{ textAlign: 'left' }}>
                        {item.text}
                      </Text>
                    </Box>
                  </Group>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

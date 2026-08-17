'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Container, Title, Timeline, Text, Anchor, Badge, Group, Stack, Grid, Paper, Box, Button } from '@mantine/core';
import { IconSchool, IconBriefcase, IconDownload, IconCertificate } from '@tabler/icons-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

function HistoryButton({ button, locale }) {
  if (!button?.link) return null;
  const isInternal = button.type === 'project' || button.link.startsWith('/');
  if (isInternal) {
    return (
      <Anchor component={Link} href={`/${locale}${button.link}`} fz="xs" fw={600} c="blue" mt={4} display="inline-block">
        {button.label} →
      </Anchor>
    );
  }
  return (
    <Anchor href={button.link} target="_blank" rel="noopener noreferrer" fz="xs" fw={600} c="blue" mt={4} display="inline-block">
      {button.label} →
    </Anchor>
  );
}

export default function HistoryTimeline({ history, locale }) {
  const containerRef = useRef(null);

  const eduItems = (history?.col1?.items || []).filter(i => i.active !== false);
  const expItems = (history?.col2?.items || []).filter(i => i.active !== false);

  useGSAP(
    () => {
      // Animate column titles
      gsap.from('.timeline-col-title', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Animate timeline nodes
      const items = containerRef.current.querySelectorAll('.mantine-Timeline-item');
      items.forEach(item => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          opacity: 0,
          x: -20,
          y: 15,
          duration: 0.6,
          ease: 'power2.out',
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <Container ref={containerRef} size="lg" py={64}>
      <Grid gutter="xl">
        {/* Colonne Aside 1 (Gauche - 35%): Formation & Éducation Sticky */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg" style={{ position: 'sticky', top: 90 }}>
            {/* Carte En-tête Éducation */}
            <Paper withBorder p="md" radius="lg">
              <Group gap="xs" mb="sm">
                <IconSchool size={20} color="var(--mantine-color-blue-6)" />
                <Title className="timeline-col-title" order={3} fz="lg">
                  {history?.col1?.title || (locale === 'en' ? 'Education' : 'Formation')}
                </Title>
              </Group>

              <Stack gap="md">
                {eduItems.map((item, i) => (
                  <Box
                    key={`${item.title}-${i}`}
                    style={{
                      borderBottom: i < eduItems.length - 1 ? '1px solid var(--mantine-color-default-border)' : 'none',
                      paddingBottom: i < eduItems.length - 1 ? '12px' : 0,
                    }}>
                    <Group justify="space-between" align="center" gap={4} mb={2}>
                      <Badge variant="light" color="blue" size="xs">
                        {item.date}
                      </Badge>
                      {item.tag && (
                        <Badge variant="dot" color="teal" size="xs">
                          {item.tag}
                        </Badge>
                      )}
                    </Group>
                    <Text fz="sm" fw={700}>
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text fz="xs" fw={600} c="blue">
                        {item.subtitle}
                      </Text>
                    )}
                    <Text fz="xs" c="dimmed" mt={2} style={{ lineHeight: 1.4 }}>
                      {item.text}
                    </Text>
                    <HistoryButton button={item.button} locale={locale} />
                  </Box>
                ))}
              </Stack>
            </Paper>

            {/* Carte Téléchargement CV */}
            <Paper withBorder p="md" radius="lg">
              <Group gap="xs" mb="xs">
                <IconCertificate size={18} color="var(--mantine-color-teal-6)" />
                <Text fw={700} size="sm">
                  {locale === 'en' ? 'Full Resume' : 'CV & Dossier'}
                </Text>
              </Group>
              <Text size="xs" c="dimmed" mb="sm">
                {locale === 'en' ? 'Download full PDF resume and certificates.' : 'Téléchargez le CV complet et le dossier de compétences.'}
              </Text>
              <Button
                component="a"
                href="/cv.pdf"
                download="CV_Aurelien_NKUMBE.pdf"
                variant="light"
                color="teal"
                fullWidth
                size="xs"
                leftSection={<IconDownload size={14} />}>
                {locale === 'en' ? 'Download CV (PDF)' : 'Télécharger le CV (PDF)'}
              </Button>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* Colonne Principale 2 (Droite - 65%): Timeline Expériences Professionnelles */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="md" pt="md">
            <Group gap="xs" mb="xs">
              <IconBriefcase size={22} color="var(--mantine-color-brand-6)" />
              <Title className="timeline-col-title" order={3} fz="xl">
                {history?.col2?.title || (locale === 'en' ? 'Experience' : 'Expérience Professionnelle')}
              </Title>
            </Group>

            <Timeline active={expItems.length} bulletSize={26} lineWidth={2} color="brand">
              {expItems.map((item, i) => (
                <Timeline.Item key={`${item.title}-${i}`} bullet={<IconBriefcase size={14} />} title={item.title}>
                  <Group gap={6} mb={6} mt={2}>
                    <Badge variant="light" color="gray" size="sm">
                      {item.date}
                    </Badge>
                    {item.tag && (
                      <Badge variant="filled" color="indigo" size="sm" radius="xs">
                        {item.tag}
                      </Badge>
                    )}
                  </Group>
                  {item.subtitle && (
                    <Text fz="sm" fw={700} c="brand.6" mb={4}>
                      {item.subtitle}
                    </Text>
                  )}
                  <Text fz="sm" c="dimmed" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {item.text}
                  </Text>
                  <HistoryButton button={item.button} locale={locale} />
                </Timeline.Item>
              ))}
            </Timeline>
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}

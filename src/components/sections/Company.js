'use client';

import Link from 'next/link';
import { Container, Title, Text, Button, Group, Box, Badge, SimpleGrid, Paper, Stack, ThemeIcon } from '@mantine/core';
import { IconCircleCheck, IconExternalLink, IconBriefcase } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

function localizedHref(locale, link) {
  if (!link) return '';
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  return `/${locale}${link === '/' ? '' : link}` || `/${locale}`;
}

export default function Company({ company, locale }) {
  if (!company) return null;

  const items = company.items || [];
  const hasBg = !!company.bg_image;

  return (
    <Box
      className={hasBg ? undefined : "section-muted"}
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
      }}
    >
      <Container size="lg" style={{ width: '100%' }}>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40} align="center">
          {/* Column 1: Logo & Company Description */}
          <Stack gap="lg">
            <Group>
              <Badge size="lg" radius="sm" variant={hasBg ? "filled" : "light"} color="indigo" leftSection={<IconBriefcase size={14} />}>
                {company.badge || 'Structure Freelance'}
              </Badge>
            </Group>
            
            <Title order={2} fz={{ base: 28, sm: 36 }} lh={1.2}>
              {company.title}
            </Title>
            
            <Text fz="md" c={hasBg ? "gray.3" : "dimmed"} style={{ fontSize: '1.1rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: company.description }} />
            
            <Group gap="sm" mt="md">
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
                  rightSection={<IconExternalLink size={16} />}
                >
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
                  color={hasBg ? 'white' : 'indigo'}
                >
                  {company.buttonProject.label}
                </Button>
              )}
            </Group>
          </Stack>

          {/* Column 2: Logo image and Core values */}
          <Paper withBorder radius="xl" p="xl" shadow="md" style={{ background: 'light-dark(var(--mantine-color-white), var(--mantine-color-dark-7))' }}>
            <Stack gap="xl">
              {/* Logo display */}
              <Group justify="center" py="md">
                <Box style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '16px', borderRadius: '50%', background: 'light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))' }}>
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
                  <Group key={idx} wrap="nowrap" align="flex-start" gap="md">
                    <ThemeIcon size={28} radius="xl" variant="light" color="indigo" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <IconCircleCheck size={18} />
                    </ThemeIcon>
                    <Box>
                      <Text fw={700} fz="md" mb={2}>
                        {item.title}
                      </Text>
                      <Text fz="sm" c="dimmed">
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

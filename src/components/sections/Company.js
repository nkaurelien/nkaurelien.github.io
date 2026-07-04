'use client';

import Link from 'next/link';
import { Container, Title, Text, Button, Group, Box, Badge, SimpleGrid, Paper, Stack, ThemeIcon } from '@mantine/core';
import { IconCircleCheck, IconExternalLink, IconBriefcase } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

export default function Company({ company }) {
  if (!company) return null;

  const items = company.items || [];

  return (
    <Box className="section-muted" py={64}>
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={40} align="center">
          {/* Column 1: Logo & Company Description */}
          <Stack gap="lg">
            <Group>
              <Badge size="lg" radius="sm" variant="light" color="indigo" leftSection={<IconBriefcase size={14} />}>
                {company.badge || 'Structure Freelance'}
              </Badge>
            </Group>
            
            <Title order={2} fz={{ base: 28, sm: 36 }} lh={1.2}>
              {company.title}
            </Title>
            
            <Text fz="md" c="dimmed" style={{ fontSize: '1.1rem', lineHeight: '1.6' }} dangerouslySetInnerHTML={{ __html: company.description }} />
            
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
                  color="indigo"
                  rightSection={<IconExternalLink size={16} />}
                >
                  {company.button.label}
                </Button>
              )}
              {company.buttonProject && (
                <Button
                  component={Link}
                  href={company.buttonProject.link}
                  size="md"
                  radius="xl"
                  variant="outline"
                  color="indigo"
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

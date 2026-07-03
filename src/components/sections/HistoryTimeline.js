'use client';

import Link from 'next/link';
import { Container, Title, SimpleGrid, Timeline, Text, Anchor, Badge, Group, Stack } from '@mantine/core';
import { IconSchool, IconBriefcase } from '@tabler/icons-react';

function HistoryButton({ button, locale }) {
  if (!button?.link) return null;
  const isInternal = button.type === 'project' || button.link.startsWith('/');
  if (isInternal) {
    return (
      <Anchor component={Link} href={`/${locale}${button.link}`} fz="sm" fw={500} mt={4} display="inline-block">
        {button.label} →
      </Anchor>
    );
  }
  return (
    <Anchor href={button.link} target="_blank" rel="noopener noreferrer" fz="sm" fw={500} mt={4} display="inline-block">
      {button.label} →
    </Anchor>
  );
}

function Column({ col, icon, locale }) {
  const items = (col?.items || []).filter(i => i.active !== false);
  return (
    <Stack gap="md">
      <Title order={3}>{col?.title}</Title>
      <Timeline active={items.length} bulletSize={22} lineWidth={2} color="brand">
        {items.map((item, i) => (
          <Timeline.Item key={`${item.title}-${i}`} bullet={icon} title={item.title}>
            <Group gap={6} mb={6}>
              <Badge variant="light" color="gray">
                {item.date}
              </Badge>
              {item.tag && (
                <Badge variant="dot" color="indigo" size="sm">
                  {item.tag}
                </Badge>
              )}
            </Group>
            {item.subtitle && (
              <Text fz="sm" fw={600} c="brand.6">
                {item.subtitle}
              </Text>
            )}
            <Text fz="sm" c="dimmed" mt={4} style={{ whiteSpace: 'pre-line' }}>
              {item.text}
            </Text>
            <HistoryButton button={item.button} locale={locale} />
          </Timeline.Item>
        ))}
      </Timeline>
    </Stack>
  );
}

export default function HistoryTimeline({ history, locale }) {
  return (
    <Container size="lg" py={64}>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
        <Column col={history?.col1} icon={<IconSchool size={12} />} locale={locale} />
        <Column col={history?.col2} icon={<IconBriefcase size={12} />} locale={locale} />
      </SimpleGrid>
    </Container>
  );
}

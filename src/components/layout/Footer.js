'use client';

import { Container, Group, Text, ActionIcon, Stack, Anchor } from '@mantine/core';
import { IconBrandLinkedin, IconBrandMedium, IconBrandGithub, IconBrandX, IconMoodSmile, IconBuilding, IconWorld } from '@tabler/icons-react';
import { withBase } from '@/lib/asset';

const ICONS = {
  Linkedin: IconBrandLinkedin,
  Newspaper: IconBrandMedium,
  Github: IconBrandGithub,
  Twitter: IconBrandX,
  Smile: IconMoodSmile,
  Building2: IconBuilding,
};

// Retire les balises HTML simples presentes dans les libelles de donnees.
function stripHtml(str = '') {
  return str.replace(/<[^>]+>/g, '');
}

export default function Footer({ app }) {
  const social = app?.social || [];
  const footer = app?.footer || {};

  const renderDeveloper = text => {
    if (!text) return null;
    const target = 'KAMITBRAINS IT';
    const parts = text.split(target);
    if (parts.length === 2) {
      return (
        <span
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', justifyContent: 'center', verticalAlign: 'middle' }}>
          <span dangerouslySetInnerHTML={{ __html: parts[0] }} />
          <Anchor
            href="https://kamitbrains.fr/"
            target="_blank"
            rel="noopener noreferrer"
            c="brand.6"
            fw={700}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBase('/img/logos/kamitbrains.svg')}
              alt="KAMITBRAINS IT Logo"
              style={{ height: '14px', width: 'auto', display: 'inline-block', verticalAlign: 'middle' }}
            />
            <span>KAMITBRAINS IT</span>
          </Anchor>
          <span dangerouslySetInnerHTML={{ __html: parts[1] }} />
        </span>
      );
    }
    return <span dangerouslySetInnerHTML={{ __html: text }} />;
  };

  return (
    <footer className="site-footer">
      <Container size="lg" py="xl">
        <Stack align="center" gap="md">
          <Group gap="xs">
            {social.map(s => {
              const Icon = ICONS[s.icon] || IconWorld;
              return (
                <ActionIcon
                  key={s.title}
                  component="a"
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="light"
                  size="lg"
                  radius="xl"
                  aria-label={s.title}>
                  <Icon size={20} />
                </ActionIcon>
              );
            })}
          </Group>
          <Group gap="xs" justify="center">
            <Anchor href="/about.md" fz="xs" c="dimmed">
              À propos détaillé
            </Anchor>
            <Text c="dimmed">·</Text>
            <Anchor href="/llms.txt" fz="xs" c="dimmed">
              llms.txt
            </Anchor>
          </Group>
          <Text size="sm" c="dimmed" ta="center">
            {stripHtml(footer.copy)} {renderDeveloper(footer.developer)}
          </Text>
        </Stack>
      </Container>
    </footer>
  );
}

'use client';

import { Container, Group, Text, ActionIcon, Stack } from '@mantine/core';
import { IconBrandLinkedin, IconBrandMedium, IconBrandGithub, IconBrandX, IconMoodSmile, IconBuilding, IconWorld } from '@tabler/icons-react';

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
          <Text size="sm" c="dimmed" ta="center">
            {stripHtml(footer.copy)} {stripHtml(footer.developer)}
          </Text>
        </Stack>
      </Container>
    </footer>
  );
}

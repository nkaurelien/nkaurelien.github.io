'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Group, Text, ActionIcon, Stack, Anchor, Title, Tooltip } from '@mantine/core';
import {
  IconBrandLinkedin,
  IconBrandMedium,
  IconBrandGithub,
  IconBrandX,
  IconMoodSmile,
  IconBuilding,
  IconWorld,
  IconMail,
  IconFileText,
} from '@tabler/icons-react';

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

// Pied de page épuré (inspiré de jev.dev) : appel à échanger, icônes discrètes
// (réseaux + contact + CV), puis mentions en petit, sur la trame de points du site.
export default function Footer({ app }) {
  const social = app?.social || [];
  const footer = app?.footer || {};
  const locale = (usePathname() || '').startsWith('/en') ? 'en' : 'fr';
  const isEnglish = locale === 'en';

  const links = [
    ...social.map(s => ({ title: s.title, href: s.link, Icon: ICONS[s.icon] || IconWorld, external: true })),
    { title: 'Contact', href: `/${locale}/contact`, Icon: IconMail },
    { title: isEnglish ? 'Resume (PDF)' : 'CV (PDF)', href: '/cv.pdf', Icon: IconFileText, external: true },
  ];

  return (
    <footer className="site-footer hero-dots-soft" data-testid="site-footer">
      <Container size="lg" pt={72} pb={40}>
        <Stack align="center" gap={0}>
          <Title order={2} fz={{ base: 26, sm: 32 }} ta="center">
            {footer.cta_title || (isEnglish ? "Let's connect." : 'Restons en contact.')}
          </Title>
          {footer.cta_text && (
            <Text c="dimmed" ta="center" mt={8} maw={620}>
              {footer.cta_text}
            </Text>
          )}

          <Group gap={6} mt={28} justify="center" component="ul" className="list-reset" aria-label={isEnglish ? 'Links' : 'Liens'}>
            {links.map(({ title, href, Icon, external }) => (
              <li key={title}>
                <Tooltip label={title} withArrow>
                  <ActionIcon
                    component={external ? 'a' : Link}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    variant="subtle"
                    color="gray"
                    size="lg"
                    radius="xl"
                    className="footer-icon"
                    aria-label={title}>
                    <Icon size={20} stroke={1.6} aria-hidden="true" />
                  </ActionIcon>
                </Tooltip>
              </li>
            ))}
          </Group>

          <Group gap="xs" justify="center" mt={28}>
            <Anchor href="/about.md" fz="xs" c="dimmed">
              {isEnglish ? 'Detailed profile' : 'À propos détaillé'}
            </Anchor>
            <Text c="dimmed" fz="xs" aria-hidden="true">
              ·
            </Text>
            <Anchor href="/llms.txt" fz="xs" c="dimmed">
              llms.txt
            </Anchor>
          </Group>
          <Text ff="monospace" fz={11} c="dimmed" ta="center" mt="xs" maw={780}>
            {stripHtml(footer.copy)} {stripHtml(footer.developer)}
          </Text>
        </Stack>
      </Container>
    </footer>
  );
}

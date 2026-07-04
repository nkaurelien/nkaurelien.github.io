'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Burger,
  Container,
  Drawer,
  Group,
  Stack,
  Button,
  Anchor,
  Text,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoonStars } from '@tabler/icons-react';

function localizedHref(locale, link) {
  return `/${locale}${link === '/' ? '' : link}` || `/${locale}`;
}

function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computed = useComputedColorScheme('light', { getInitialValueInEffect: true });
  // 1er rendu (serveur + hydratation) en "clair" pour eviter un mismatch ;
  // on bascule sur l'etat reel apres montage.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && computed === 'dark';
  return (
    <ActionIcon
      variant="default"
      size="lg"
      radius="xl"
      onClick={() => setColorScheme(computed === 'dark' ? 'light' : 'dark')}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
      aria-label="Basculer le thème">
      {isDark ? <IconSun size={18} /> : <IconMoonStars size={18} />}
    </ActionIcon>
  );
}

function LocaleSwitcher({ locale }) {
  const pathname = usePathname() || `/${locale}`;
  const other = locale === 'fr' ? 'en' : 'fr';
  // Remplace le segment de locale en tete de chemin.
  const target = pathname.replace(/^\/(fr|en)/, `/${other}`);
  return (
    <Button component={Link} href={target} variant="light" size="xs">
      {other.toUpperCase()}
    </Button>
  );
}

export default function Header({ locale, app }) {
  const [opened, { toggle, close }] = useDisclosure(false);
  const menu = app?.header?.menu || [];
  const pathname = usePathname() || `/${locale}`;

  const isActive = link => {
    if (link === '/') {
      return pathname === `/${locale}` || pathname === `/${locale}/`;
    }
    const localized = localizedHref(locale, link);
    return pathname === localized || pathname.startsWith(localized + '/');
  };

  const renderLink = (item, onClick) => {
    const active = !item.external && isActive(item.link);
    const linkHref = item.external ? item.link : localizedHref(locale, item.link);
    const classNames = `nav-link ${active ? 'nav-link-active' : ''}`.trim();

    return (
      <Anchor
        key={item.label}
        component={item.external ? 'a' : Link}
        href={linkHref}
        target={item.external ? '_blank' : undefined}
        rel={item.external ? 'noopener noreferrer' : undefined}
        className={classNames}
        onClick={onClick}
        underline="never">
        {item.label}
      </Anchor>
    );
  };

  return (
    <header className="site-header">
      <Container size="lg" h={64}>
        <Group h="100%" justify="space-between">
          <Anchor component={Link} href={`/${locale}`} underline="never">
            <Text fw={800} size="lg" c="brand.6">
              Aurelien<span style={{ color: 'var(--mantine-color-dimmed)' }}>.NKUMBE</span>
            </Text>
          </Anchor>

          <Group gap="xs" visibleFrom="md">
            {menu.flatMap(item => {
              const link = renderLink(item);
              if (item.label === 'Contact') {
                return [link, <Divider key="divider-contact" orientation="vertical" h={16} style={{ alignSelf: 'center' }} />];
              }
              return [link];
            })}
            <LocaleSwitcher locale={locale} />
            <ColorSchemeToggle />
          </Group>

          <Group gap="xs" hiddenFrom="md">
            <ColorSchemeToggle />
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>
        </Group>
      </Container>

      <Drawer opened={opened} onClose={close} title="Menu" hiddenFrom="md" position="right" size="xs">
        <Stack gap="md" mt="md">
          {menu.flatMap(item => {
            const link = renderLink(item, close);
            if (item.label === 'Contact') {
              return [link, <Divider key="divider-contact" my="xs" />];
            }
            return [link];
          })}
          <Group justify="space-between" mt="lg" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Text fz="sm" c="dimmed">
              Langue
            </Text>
            <LocaleSwitcher locale={locale} />
          </Group>
        </Stack>
      </Drawer>
    </header>
  );
}

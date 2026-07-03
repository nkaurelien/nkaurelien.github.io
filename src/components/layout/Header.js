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

  const renderLink = (item, onClick) => {
    if (item.external) {
      return (
        <Anchor key={item.label} href={item.link} target="_blank" rel="noopener noreferrer" fw={500} c="var(--mantine-color-text)" onClick={onClick}>
          {item.label}
        </Anchor>
      );
    }
    return (
      <Anchor key={item.label} component={Link} href={localizedHref(locale, item.link)} fw={500} c="var(--mantine-color-text)" onClick={onClick}>
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

          <Group gap="lg" visibleFrom="sm">
            {menu.map(item => renderLink(item))}
            <LocaleSwitcher locale={locale} />
            <ColorSchemeToggle />
          </Group>

          <Group gap="xs" hiddenFrom="sm">
            <ColorSchemeToggle />
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>
        </Group>
      </Container>

      <Drawer opened={opened} onClose={close} title="Menu" hiddenFrom="sm" position="right">
        <Stack gap="md">
          {menu.map(item => renderLink(item, close))}
          <LocaleSwitcher locale={locale} />
        </Stack>
      </Drawer>
    </header>
  );
}

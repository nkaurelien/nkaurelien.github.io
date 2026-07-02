'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Burger, Container, Drawer, Group, Stack, Button, Anchor, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

function localizedHref(locale, link) {
  return `/${locale}${link === '/' ? '' : link}` || `/${locale}`;
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
        <Anchor key={item.label} href={item.link} target="_blank" rel="noopener noreferrer" fw={500} c="dark" onClick={onClick}>
          {item.label}
        </Anchor>
      );
    }
    return (
      <Anchor key={item.label} component={Link} href={localizedHref(locale, item.link)} fw={500} c="dark" onClick={onClick}>
        {item.label}
      </Anchor>
    );
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
      }}>
      <Container size="lg" h={64}>
        <Group h="100%" justify="space-between">
          <Anchor component={Link} href={`/${locale}`} underline="never">
            <Text fw={800} size="lg" c="brand.7">
              Aurelien<span style={{ color: 'var(--mantine-color-gray-6)' }}>.NKUMBE</span>
            </Text>
          </Anchor>

          <Group gap="lg" visibleFrom="sm">
            {menu.map(item => renderLink(item))}
            <LocaleSwitcher locale={locale} />
          </Group>

          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
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

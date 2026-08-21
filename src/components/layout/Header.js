'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Menu,
  UnstyledButton,
  Avatar,
  useMantineColorScheme,
  useComputedColorScheme,
  Divider,
  Box,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSun,
  IconMoonStars,
  IconSparkles,
  IconChevronDown,
  IconLayoutDashboard,
  IconLogout,
  IconDownload,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';

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
  const { user, signOutUser } = useAuth();
  const router = useRouter();
  const [opened, { toggle, close }] = useDisclosure(false);
  const [scrolled, setScrolled] = useState(false);
  const menu = app?.header?.menu || [];
  const pathname = usePathname() || `/${locale}`;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      close();
      router.push(`/${locale}`);
    }
  };

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'nkumbeaurelien@hotmail.com';
  const isAdminUser = !!user && user.email === adminEmail;

  const menuWithAdmin = [...menu];
  if (isAdminUser) {
    menuWithAdmin.push({
      label: 'Admin',
      link: '/admin',
      external: false,
    });
  }

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

    // Met en avant l'Assistant IA (fonctionnalité phare) : bouton pill dégradé + icône.
    if (!item.external && item.link === '/chat') {
      return (
        <Button
          key={item.label}
          component={Link}
          href={linkHref}
          onClick={onClick}
          size="xs"
          radius="xl"
          variant="gradient"
          gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
          leftSection={<IconSparkles size={14} />}
          className="ai-nav-btn"
          style={{ fontWeight: 600, boxShadow: '0 2px 12px rgba(34, 139, 230, 0.35)' }}>
          {item.label}
        </Button>
      );
    }

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

  // Item "Admin" : menu déroulant (accès espace admin + déconnexion).
  const renderAdminMenu = () => {
    const active = isActive('/admin');
    return (
      <Menu key="admin-menu" position="bottom-end" shadow="md" width={220} withinPortal>
        <Menu.Target>
          <UnstyledButton
            className={`nav-link ${active ? 'nav-link-active' : ''}`.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Admin
            <IconChevronDown size={14} />
          </UnstyledButton>
        </Menu.Target>
        <Menu.Dropdown>
          {user?.email && <Menu.Label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</Menu.Label>}
          <Menu.Item component={Link} href={localizedHref(locale, '/admin')} leftSection={<IconLayoutDashboard size={16} />}>
            Espace admin
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
            Se déconnecter
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  };

  // Invité connecté (non-admin) : menu avatar + déconnexion.
  const renderUserMenu = () => (
    <Menu key="user-menu" position="bottom-end" shadow="md" width={220} withinPortal>
      <Menu.Target>
        <UnstyledButton className="nav-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Avatar src={user?.photoURL || undefined} size={24} radius="xl" color="brand">
            {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
          </Avatar>
          <Text component="span" size="sm" fw={500} style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.displayName || user?.email}
          </Text>
          <IconChevronDown size={14} />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {user?.email && <Menu.Label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</Menu.Label>}
        <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={handleLogout}>
          Se déconnecter
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );

  return (
    <header
      className={`site-header ${scrolled ? 'site-header-scrolled' : ''}`}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all 0.3s ease',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.88)' : 'transparent',
        boxShadow: scrolled ? '0 4px 20px rgba(0, 0, 0, 0.06)' : 'none',
        borderBottom: scrolled ? '1px solid var(--mantine-color-default-border)' : '1px solid transparent',
      }}>
      <Container fluid h={64} px={{ base: 'md', sm: 'xl', md: 32 }}>
        <Group h="100%" justify="space-between" wrap="nowrap" align="center">
          {/* 1. Logo à Gauche */}
          <Box style={{ flex: '1 1 0', minWidth: 0 }}>
            <Anchor component={Link} href={`/${locale}`} underline="never" style={{ display: 'inline-block' }}>
              <Text fw={800} size="lg" c="brand.6" style={{ whiteSpace: 'nowrap' }}>
                Aurelien<span style={{ color: 'var(--mantine-color-dimmed)' }}>.NKUMBE</span>
              </Text>
            </Anchor>
          </Box>

          {/* 2. Navigation Principale Centrée au milieu */}
          <Group component="nav" gap="xs" visibleFrom="md" wrap="nowrap" justify="center" style={{ flex: '0 1 auto' }}>
            {menuWithAdmin.flatMap(item => {
              if (item.label === 'Admin') {
                return [renderAdminMenu()];
              }
              const link = renderLink(item);
              if (item.link === '/chat') {
                return [<Divider key="divider-engage" orientation="vertical" h={16} style={{ alignSelf: 'center' }} />, link];
              }
              return [link];
            })}
          </Group>

          {/* 3. Actions / Outils à Droite */}
          <Group gap="xs" visibleFrom="md" wrap="nowrap" justify="flex-end" style={{ flex: '1 1 0', minWidth: 0 }}>
            {user && !isAdminUser && renderUserMenu()}
            <Menu position="bottom-end" shadow="md" width={280} withinPortal>
              <Menu.Target>
                <Button
                  variant="light"
                  color="teal"
                  size="xs"
                  radius="xl"
                  leftSection={<IconDownload size={14} />}
                  rightSection={<IconChevronDown size={12} />}
                  style={{ fontWeight: 600 }}>
                  CV PDF
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Mes CV & Dossiers de compétences</Menu.Label>
                <Menu.Divider />
                <Menu.Item component="a" href="/cv.pdf" target="_blank" rel="noopener noreferrer" leftSection={<IconArrowUpRight size={14} />}>
                  CV Principal (Complet)
                </Menu.Item>
                <Menu.Item component="a" href="/cv-lite.pdf" target="_blank" rel="noopener noreferrer" leftSection={<IconArrowUpRight size={14} />}>
                  CV Synthétique (1 Page)
                </Menu.Item>
                <Menu.Item
                  component="a"
                  href="/dossier-de-competences.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  leftSection={<IconArrowUpRight size={14} />}>
                  Dossier de Compétences (ESN)
                </Menu.Item>
                <Menu.Item
                  component="a"
                  href="/cv-fullstack.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  leftSection={<IconArrowUpRight size={14} />}>
                  CV Dev Fullstack (Python/React)
                </Menu.Item>
                <Menu.Item
                  component="a"
                  href="/cv-angular-laravel.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  leftSection={<IconArrowUpRight size={14} />}>
                  CV Dev Angular & Laravel PHP
                </Menu.Item>
                <Menu.Item component="a" href="/cv-devops.pdf" target="_blank" rel="noopener noreferrer" leftSection={<IconArrowUpRight size={14} />}>
                  CV Lead DevSecOps & Cloud
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <LocaleSwitcher locale={locale} />
            <ColorSchemeToggle />
          </Group>

          {/* Menu Burger sur mobile */}
          <Group gap="xs" hiddenFrom="md">
            <ColorSchemeToggle />
            <Burger opened={opened} onClick={toggle} size="sm" />
          </Group>
        </Group>
      </Container>

      <Drawer opened={opened} onClose={close} title="Menu" hiddenFrom="md" position="right" size="xs">
        <Stack component="nav" gap="md" mt="md">
          {menuWithAdmin.flatMap(item => {
            if (item.label === 'Admin') {
              return [
                <Divider key="divider-admin" my="xs" />,
                renderLink(item, close),
                <Button
                  key="logout"
                  variant="light"
                  color="red"
                  size="xs"
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                  justify="flex-start">
                  Se déconnecter
                </Button>,
              ];
            }
            const link = renderLink(item, close);
            if (item.link === '/chat') {
              return [<Divider key="divider-engage" my="xs" />, link];
            }
            return [link];
          })}

          <Button
            component="a"
            href="/cv.pdf"
            download="CV_Aurelien_NKUMBE.pdf"
            variant="filled"
            color="teal"
            size="xs"
            radius="xl"
            leftSection={<IconDownload size={16} />}
            onClick={close}
            justify="flex-start"
            mt="xs">
            Télécharger CV (PDF)
          </Button>

          {user && !isAdminUser && (
            <>
              <Divider my="xs" />
              <Group gap="xs" wrap="nowrap">
                <Avatar src={user.photoURL || undefined} size={28} radius="xl" color="brand">
                  {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                </Avatar>
                <Text size="sm" fw={500} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName || user.email}
                </Text>
              </Group>
              <Button variant="light" color="red" size="xs" leftSection={<IconLogout size={16} />} onClick={handleLogout} justify="flex-start">
                Se déconnecter
              </Button>
            </>
          )}

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

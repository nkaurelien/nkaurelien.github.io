'use client';

import { useState } from 'react';
import { Menu, Button, Text, Badge, Group, Box, Tooltip, ActionIcon } from '@mantine/core';
import {
  IconFileTypePdf,
  IconDownload,
  IconFileText,
  IconBriefcase,
  IconCode,
  IconBrandPhp,
  IconCloud,
  IconCodeAsterisk,
  IconChevronUp,
  IconEye,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import CvPreviewModal from '@/components/layout/CvPreviewModal';

export default function CvFloatingButton() {
  const pathname = usePathname() || '';
  const isEnglish = pathname.startsWith('/en');

  const [modalOpened, setModalOpened] = useState(false);
  const [activeCvId, setActiveCvId] = useState('cv');

  const handleOpenPreview = id => {
    setActiveCvId(id);
    setModalOpened(true);
  };

  const cvList = [
    {
      id: 'cv',
      title: isEnglish ? 'Main CV (Full Profile)' : 'CV Principal (Complet)',
      subtitle: isEnglish ? 'Full resume with all experiences' : 'Parcours détaillé & compétences',
      href: '/cv.pdf',
      download: 'CV_Aurelien_NKUMBE.pdf',
      icon: <IconFileText size={18} style={{ color: 'var(--mantine-color-blue-6)' }} />,
      badge: 'PDF',
    },
    {
      id: 'cv-lite',
      title: isEnglish ? 'Lite CV (1 Page)' : 'CV Synthétique (1 Page)',
      subtitle: isEnglish ? 'Condensed 1-page summary' : 'Format 1 page condensé',
      href: '/cv-lite.pdf',
      download: 'CV_Aurelien_NKUMBE_Lite.pdf',
      icon: <IconFileTypePdf size={18} style={{ color: 'var(--mantine-color-teal-6)' }} />,
      badge: '1 Page',
    },
    {
      id: 'dossier-de-competences',
      title: isEnglish ? 'Skills Dossier (Consulting)' : 'Dossier de Compétences',
      subtitle: isEnglish ? 'ESN & consulting format' : 'Format ESN & missions détaillées',
      href: '/dossier-de-competences.pdf',
      download: 'Dossier_de_Competences_Aurelien_NKUMBE.pdf',
      icon: <IconBriefcase size={18} style={{ color: 'var(--mantine-color-grape-6)' }} />,
      badge: 'ESN',
    },
    {
      id: 'cv-fullstack',
      title: isEnglish ? 'Fullstack Dev (FastAPI, React)' : 'CV Dev Fullstack',
      subtitle: isEnglish ? 'Python, Next.js, React, Node.js' : 'Python, Next.js, React, Node.js',
      href: '/cv-fullstack.pdf',
      download: 'CV_Aurelien_NKUMBE_Fullstack.pdf',
      icon: <IconCode size={18} style={{ color: 'var(--mantine-color-cyan-6)' }} />,
      badge: 'Python/React',
    },
    {
      id: 'cv-angular-laravel',
      title: isEnglish ? 'Angular & Laravel PHP Dev' : 'CV Angular & Laravel PHP',
      subtitle: isEnglish ? 'PHP 8.x, Filament, Angular, RxJS' : 'PHP 8.x, Filament, Angular, RxJS',
      href: '/cv-angular-laravel.pdf',
      download: 'CV_Aurelien_NKUMBE_Angular_Laravel.pdf',
      icon: <IconBrandPhp size={18} style={{ color: 'var(--mantine-color-indigo-6)' }} />,
      badge: 'PHP/Angular',
    },
    {
      id: 'cv-devops',
      title: isEnglish ? 'Lead DevSecOps & Cloud' : 'CV Lead DevSecOps & Cloud',
      subtitle: isEnglish ? 'Docker, K8s, CI/CD, Ansible' : 'Docker, K8s, CI/CD, Ansible',
      href: '/cv-devops.pdf',
      download: 'CV_Aurelien_NKUMBE_DevOps.pdf',
      icon: <IconCloud size={18} style={{ color: 'var(--mantine-color-orange-6)' }} />,
      badge: 'DevSecOps',
    },
  ];

  return (
    <>
      <Box
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999,
        }}>
        <Menu
          position="top-end"
          shadow="xl"
          radius="lg"
          width={320}
          withinPortal
          offset={12}
          transitionProps={{ transition: 'pop-bottom-right', duration: 200 }}>
          <Menu.Target>
            <Tooltip label={isEnglish ? 'Preview & Download CVs' : 'Aperçu & Téléchargement des CV'} position="left" withArrow>
              <Button
                variant="gradient"
                gradient={{ from: 'teal.6', to: 'cyan.6', deg: 45 }}
                size="md"
                radius="xl"
                leftSection={<IconDownload size={18} />}
                rightSection={<IconChevronUp size={14} style={{ opacity: 0.8 }} />}
                style={{
                  boxShadow: '0 8px 24px rgba(20, 184, 166, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  letterSpacing: 0.2,
                  transition: 'all 0.25s ease',
                }}
                className="cv-fab-button">
                CV & Portfolio
              </Button>
            </Tooltip>
          </Menu.Target>

          <Menu.Dropdown p="xs" style={{ border: '1px solid var(--mantine-color-default-border)' }}>
            <Menu.Label fz="xs" fw={700} c="dimmed" tt="uppercase" px="xs" py={4}>
              {isEnglish ? 'Preview & Download CVs' : 'Prévisualiser & Télécharger'}
            </Menu.Label>

            <Menu.Divider />

            {cvList.map((item, idx) => (
              <Menu.Item key={idx} onClick={() => handleOpenPreview(item.id)} leftSection={item.icon} py={8} px="xs" style={{ borderRadius: 8 }}>
                <Group justify="space-between" wrap="nowrap" gap={4}>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={600} style={{ lineHeight: 1.2 }}>
                      {item.title}
                    </Text>
                    <Text size="11px" c="dimmed" style={{ lineHeight: 1.2, marginTop: 2 }}>
                      {item.subtitle}
                    </Text>
                  </Box>
                  <Group gap={4} wrap="nowrap">
                    <Tooltip
                      label={isEnglish ? 'Open PDF in new tab (copiable link)' : 'Ouvrir PDF dans un nouvel onglet (lien copiable)'}
                      withinPortal>
                      <ActionIcon
                        component="a"
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        variant="subtle"
                        color="blue"
                        size="xs">
                        <IconArrowUpRight size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={isEnglish ? 'Direct PDF download' : 'Télécharger PDF direct'} withinPortal>
                      <ActionIcon
                        component="a"
                        href={item.href}
                        download={item.download}
                        onClick={e => e.stopPropagation()}
                        variant="subtle"
                        color="teal"
                        size="xs">
                        <IconDownload size={14} />
                      </ActionIcon>
                    </Tooltip>
                    <Badge size="xs" variant="light" color="gray" style={{ textTransform: 'none', flexShrink: 0 }}>
                      {item.badge}
                    </Badge>
                  </Group>
                </Group>
              </Menu.Item>
            ))}

            <Menu.Divider />

            <Menu.Item
              component="a"
              href="/cv.json"
              target="_blank"
              rel="noopener noreferrer"
              leftSection={<IconCodeAsterisk size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />}
              py={6}
              px="xs"
              style={{ borderRadius: 8 }}>
              <Group justify="space-between" wrap="nowrap">
                <Text size="xs" c="dimmed" fw={500}>
                  {isEnglish ? 'JSON Resume Format (Open/Copy)' : 'Format JSON Resume (Ouvrir/Copier)'}
                </Text>
                <Badge size="xs" variant="outline" color="gray">
                  JSON
                </Badge>
              </Group>
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>

        <style jsx global>{`
          .cv-fab-button:hover {
            transform: translateY(-2px) scale(1.03);
            box-shadow: 0 12px 28px rgba(20, 184, 166, 0.5) !important;
          }
        `}</style>
      </Box>

      {/* Modal de prévisualisation Markdown interactive & téléchargement PDF */}
      <CvPreviewModal opened={modalOpened} onClose={() => setModalOpened(false)} activeCvId={activeCvId} onSelectCvId={id => setActiveCvId(id)} />
    </>
  );
}

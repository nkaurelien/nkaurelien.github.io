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
  IconSparkles,
} from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import CvPreviewModal from '@/components/layout/CvPreviewModal';
import { trackAndNotifyCvDownload } from '@/lib/cvAnalytics';

export default function CvFloatingButton() {
  const pathname = usePathname() || '';
  const isEnglish = pathname.startsWith('/en');

  const [modalOpened, setModalOpened] = useState(false);
  const [activeCvId, setActiveCvId] = useState('cv');

  const handleOpenPreview = id => {
    setActiveCvId(id);
    setModalOpened(true);
  };

  const handleDirectDownload = (href, downloadName, id, title) => {
    trackAndNotifyCvDownload({
      cvId: id,
      cvTitle: title,
      source: 'floating_button_download',
    });
    const link = document.createElement('a');
    link.href = href;
    link.download = downloadName || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenTab = (href, id, title) => {
    trackAndNotifyCvDownload({
      cvId: id,
      cvTitle: title,
      source: 'floating_button_tab_view',
    });
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const cvList = [
    {
      id: 'about',
      title: isEnglish ? 'In Brief (Profile & Vision)' : 'En bref (Profil & Vision)',
      subtitle: isEnglish ? 'Summary, philosophy & tech vision (2 pages)' : 'Synthèse, philosophie & vision (2 pages)',
      href: '/about.pdf',
      download: 'En_Bref_Aurelien_NKUMBE.pdf',
      icon: <IconSparkles size={18} style={{ color: 'var(--mantine-color-grape-6)' }} />,
      badge: '2 Pages',
    },
    {
      id: 'cv',
      title: isEnglish ? 'Main CV (ATS Format)' : 'CV Principal (Format ATS)',
      subtitle: isEnglish ? 'Concise & ATS-optimized format (2 pages)' : 'Format condensé & optimisé ATS (2 pages)',
      href: '/Astrid_Aurelien_NKUMBE_ENONGENE_CV.pdf',
      download: 'Astrid_Aurelien_NKUMBE_ENONGENE_CV.pdf',
      icon: <IconFileText size={18} style={{ color: 'var(--mantine-color-kamit-6)' }} />,
      badge: 'ATS 2P',
    },
    {
      id: 'cv-curve',
      title: isEnglish ? 'Detailed CV (Design Format)' : 'CV Détaillé (Format Design)',
      subtitle: isEnglish ? 'Multi-page design with rich sections (3 pages)' : 'Design élégant & rubriques détaillées (3 pages)',
      href: '/cv-curve.pdf',
      download: 'CV_Curve_Aurelien_NKUMBE.pdf',
      icon: <IconFileTypePdf size={18} style={{ color: 'var(--mantine-color-blue-6)' }} />,
      badge: 'Design 3P',
    },
    {
      id: 'cv-vidushi-wahal',
      title: isEnglish ? 'Modern Executive CV' : 'CV Exécutif Moderne',
      subtitle: isEnglish ? 'Clear executive format (2 pages)' : 'Format exécutif moderne (2 pages)',
      href: '/cv-vidushi-wahal.pdf',
      download: 'CV_Moderne_Aurelien_NKUMBE.pdf',
      icon: <IconFileTypePdf size={18} style={{ color: 'var(--mantine-color-teal-6)' }} />,
      badge: 'Exécutif 2P',
    },
    {
      id: 'lettre-de-motivation',
      title: isEnglish ? 'Cover Letter' : 'Lettre de Motivation',
      subtitle: isEnglish ? 'Spontaneous cover letter format (1 page)' : 'Lettre spontanée Vous-Moi-Nous (1 page)',
      href: '/lettre-de-motivation-globale.pdf',
      download: 'Lettre_de_Motivation_Aurelien_NKUMBE.pdf',
      icon: <IconFileText size={18} style={{ color: 'var(--mantine-color-indigo-6)' }} />,
      badge: '1 Page',
    },
    {
      id: 'dossier-de-competences',
      title: isEnglish ? 'Skills Dossier (Consulting/ESN)' : 'Dossier de Compétences (ESN)',
      subtitle: isEnglish ? 'Detailed missions & consulting profile (5 pages)' : 'Format ESN & missions détaillées (5 pages)',
      href: '/dossier-de-competences.pdf',
      download: 'Dossier_de_Competences_Aurelien_NKUMBE.pdf',
      icon: <IconBriefcase size={18} style={{ color: 'var(--mantine-color-grape-6)' }} />,
      badge: 'ESN 5P',
    },
    {
      id: 'cv-devops',
      title: isEnglish ? 'Lead DevSecOps & Cloud' : 'CV Lead DevSecOps & Cloud',
      subtitle: isEnglish ? 'Docker, K8s, CI/CD, Ansible, SecOps (2 pages)' : 'Docker, K8s, CI/CD, Ansible, SecOps (2 pages)',
      href: '/cv-devops.pdf',
      download: 'CV_Aurelien_NKUMBE_DevOps.pdf',
      icon: <IconCloud size={18} style={{ color: 'var(--mantine-color-orange-6)' }} />,
      badge: 'DevSecOps 2P',
    },
    {
      id: 'cv-fullstack',
      title: isEnglish ? 'Senior Fullstack Dev' : 'CV Dev Fullstack',
      subtitle: isEnglish ? 'Python, Next.js, React, Node.js (2 pages)' : 'Python, Next.js, React, Node.js (2 pages)',
      href: '/cv-fullstack.pdf',
      download: 'CV_Aurelien_NKUMBE_Fullstack.pdf',
      icon: <IconCode size={18} style={{ color: 'var(--mantine-color-cyan-6)' }} />,
      badge: 'Fullstack 2P',
    },
    {
      id: 'cv-angular-laravel',
      title: isEnglish ? 'Angular & Laravel PHP Dev' : 'CV Angular & Laravel PHP',
      subtitle: isEnglish ? 'PHP 8.x, Filament, Angular, RxJS (2 pages)' : 'PHP 8.x, Filament, Angular, RxJS (2 pages)',
      href: '/cv-angular-laravel.pdf',
      download: 'CV_Aurelien_NKUMBE_Angular_Laravel.pdf',
      icon: <IconBrandPhp size={18} style={{ color: 'var(--mantine-color-kamit-6)' }} />,
      badge: 'PHP/Angular 2P',
    },
  ];

  return (
    <>
      <Box
        data-testid="cv-floating"
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
          width={350}
          withinPortal
          offset={12}
          transitionProps={{ transition: 'pop-bottom-right', duration: 200 }}>
          <Menu.Target>
            <Tooltip label={isEnglish ? 'Preview & Download CVs' : 'Aperçu & Téléchargement des CV'} position="left" withArrow>
              <Button
                variant="gradient"
                gradient={{ from: 'kamit.9', to: 'kamit.7', deg: 45 }}
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
              <Menu.Item
                key={idx}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.umami?.track('cv_fab_menu_select', { cvId: item.id, title: item.title });
                  }
                  handleOpenPreview(item.id);
                }}
                leftSection={item.icon}
                py={8}
                px="xs"
                style={{ borderRadius: 8 }}>
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
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenTab(item.href, item.id, item.title);
                        }}
                        variant="subtle"
                        color="kamit"
                        size="xs"
                        aria-label={`${isEnglish ? 'Open in a new tab' : 'Ouvrir dans un nouvel onglet'} : ${item.title}`}>
                        <IconArrowUpRight size={14} aria-hidden="true" />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label={isEnglish ? 'Direct PDF download' : 'Télécharger PDF direct'} withinPortal>
                      <ActionIcon
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDirectDownload(item.href, item.download, item.id, item.title);
                        }}
                        variant="subtle"
                        color="kamit"
                        size="xs"
                        aria-label={`${isEnglish ? 'Download PDF' : 'Télécharger le PDF'} : ${item.title}`}>
                        <IconDownload size={14} aria-hidden="true" />
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

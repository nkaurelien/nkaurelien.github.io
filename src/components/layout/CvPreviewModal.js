'use client';

import { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Box,
  Text,
  Badge,
  ActionIcon,
  Tooltip,
  ScrollArea,
  SegmentedControl,
  Loader,
  Stack,
  TextInput,
  Paper,
} from '@mantine/core';
import { IconDownload, IconCopy, IconCheck, IconEye, IconX, IconMail, IconBuilding, IconUser } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const CV_OPTIONS = [
  {
    id: 'cv',
    label: 'CV Principal',
    title: 'CV Principal (Complet)',
    mdUrl: '/cv.md',
    pdfUrl: '/cv.pdf',
    downloadName: 'CV_Aurelien_NKUMBE.pdf',
    badge: 'Complet',
  },
  {
    id: 'cv-lite',
    label: '1 Page (Lite)',
    title: 'CV Synthétique (1 Page)',
    mdUrl: '/cv-lite.md',
    pdfUrl: '/cv-lite.pdf',
    downloadName: 'CV_Aurelien_NKUMBE_Lite.pdf',
    badge: '1 Page',
  },
  {
    id: 'dossier-de-competences',
    label: 'Dossier ESN',
    title: 'Dossier de Compétences (ESN / Conseil)',
    mdUrl: '/dossier-de-competences.md',
    pdfUrl: '/dossier-de-competences.pdf',
    downloadName: 'Dossier_de_Competences_Aurelien_NKUMBE.pdf',
    badge: 'ESN/Conseil',
  },
  {
    id: 'cv-fullstack',
    label: 'Fullstack Dev',
    title: 'CV Spécialité Dev Fullstack (FastAPI, React)',
    mdUrl: '/cv-fullstack.md',
    pdfUrl: '/cv-fullstack.pdf',
    downloadName: 'CV_Aurelien_NKUMBE_Fullstack.pdf',
    badge: 'Python/React',
  },
  {
    id: 'cv-angular-laravel',
    label: 'Angular & Laravel',
    title: 'CV Spécialité Angular & Laravel PHP',
    mdUrl: '/cv-angular-laravel.md',
    pdfUrl: '/cv-angular-laravel.pdf',
    downloadName: 'CV_Aurelien_NKUMBE_Angular_Laravel.pdf',
    badge: 'PHP/Angular',
  },
  {
    id: 'cv-devops',
    label: 'DevSecOps',
    title: 'CV Spécialité Lead DevSecOps & Cloud',
    mdUrl: '/cv-devops.md',
    pdfUrl: '/cv-devops.pdf',
    downloadName: 'CV_Aurelien_NKUMBE_DevOps.pdf',
    badge: 'DevSecOps',
  },
];

export default function CvPreviewModal({ opened, onClose, activeCvId = 'cv', onSelectCvId }) {
  const selectedCv = CV_OPTIONS.find(c => c.id === activeCvId) || CV_OPTIONS[0];
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const clipboard = useClipboard({ timeout: 2000 });

  // État de capture d'email / lead gate
  const [leadModalOpened, setLeadModalOpened] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [emailCaptured, setEmailCaptured] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('cv_lead_email');
      if (savedEmail) {
        setUserEmail(savedEmail);
        setEmailCaptured(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!opened || !selectedCv) return;

    setLoading(true);
    fetch(selectedCv.mdUrl)
      .then(res => {
        if (!res.ok) throw new Error('Impossible de charger le fichier Markdown');
        return res.text();
      })
      .then(text => {
        setContent(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur chargement preview CV:', err);
        setContent('_Erreur de chargement du fichier Markdown._');
        setLoading(false);
      });
  }, [opened, selectedCv]);

  // Déclenche le téléchargement du fichier PDF
  const triggerPdfDownload = (pdfUrl, downloadName) => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = downloadName || 'CV_Aurelien_NKUMBE.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clic sur le bouton de téléchargement
  const handleDownloadClick = () => {
    if (emailCaptured) {
      triggerPdfDownload(selectedCv.pdfUrl, selectedCv.downloadName);
    } else {
      setLeadModalOpened(true);
    }
  };

  // Soumission du formulaire d'email
  const handleLeadSubmit = async e => {
    e.preventDefault();
    if (!userEmail.trim()) return;

    setIsSubmittingLead(true);

    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName,
          company: userCompany,
          cvId: selectedCv.id,
        }),
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('cv_lead_email', userEmail);
      }
      setEmailCaptured(true);
      setLeadModalOpened(false);
      triggerPdfDownload(selectedCv.pdfUrl, selectedCv.downloadName);
    } catch (err) {
      console.error('Erreur enregistrement lead:', err);
      setEmailCaptured(true);
      setLeadModalOpened(false);
      triggerPdfDownload(selectedCv.pdfUrl, selectedCv.downloadName);
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="xl"
        radius="lg"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
        withCloseButton={false}
        styles={{
          header: { padding: 0 },
          body: { padding: '20px 24px 28px' },
          content: { border: '1px solid var(--mantine-color-default-border)', overflow: 'hidden' },
        }}>
        {/* Header personnalisé avec contrôles & téléchargement */}
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)', backgroundColor: 'var(--mantine-color-default-hover)' }}>
          <Group justify="space-between" align="center" wrap="wrap" gap="sm">
            <Group gap="xs">
              <IconEye size={20} style={{ color: 'var(--mantine-color-teal-6)' }} />
              <Box>
                <Group gap={8} align="center">
                  <Text fw={700} size="md" style={{ lineHeight: 1.2 }}>
                    {selectedCv.title}
                  </Text>
                  <Badge size="xs" variant="light" color="teal">
                    {selectedCv.badge}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  Prévisualisation Markdown interactive & export PDF
                </Text>
              </Box>
            </Group>

            <Group gap="xs">
              <Tooltip label={clipboard.copied ? 'Copié !' : 'Copier le Markdown'} withArrow>
                <ActionIcon variant="light" color={clipboard.copied ? 'teal' : 'gray'} onClick={() => clipboard.copy(content)} size="md" radius="md">
                  {clipboard.copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>

              <Button
                onClick={handleDownloadClick}
                variant="gradient"
                gradient={{ from: 'teal.6', to: 'cyan.6', deg: 45 }}
                size="xs"
                radius="md"
                leftSection={<IconDownload size={15} />}
                style={{ fontWeight: 700 }}>
                Télécharger PDF
              </Button>

              <ActionIcon variant="subtle" color="gray" onClick={onClose} size="md" radius="md">
                <IconX size={18} />
              </ActionIcon>
            </Group>
          </Group>

          {/* Sélecteur de version au sein de la modal */}
          <Box mt="md" style={{ overflowX: 'auto' }}>
            <SegmentedControl
              value={selectedCv.id}
              onChange={val => onSelectCvId && onSelectCvId(val)}
              data={CV_OPTIONS.map(c => ({ label: c.label, value: c.id }))}
              size="xs"
              radius="md"
              fullWidth
            />
          </Box>
        </Box>

        {/* Contenu Markdown de prévisualisation */}
        <Box mt="md">
          {loading ? (
            <Stack align="center" justify="center" py={60}>
              <Loader color="teal" type="dots" size="lg" />
              <Text size="sm" c="dimmed">
                Chargement du CV...
              </Text>
            </Stack>
          ) : (
            <div className="cv-markdown-preview">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </Box>

        <style jsx global>{`
          .cv-markdown-preview {
            font-size: 0.92rem;
            line-height: 1.6;
            color: var(--mantine-color-text);
          }
          .cv-markdown-preview h1 {
            font-size: 1.6rem;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 0.4rem;
            color: var(--mantine-color-teal-6);
          }
          .cv-markdown-preview h2 {
            font-size: 1.15rem;
            font-weight: 700;
            margin-top: 1.4rem;
            margin-bottom: 0.6rem;
            padding-bottom: 0.25rem;
            border-bottom: 2px solid var(--mantine-color-default-border);
            color: var(--mantine-color-blue-6);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .cv-markdown-preview h3 {
            font-size: 1rem;
            font-weight: 700;
            margin-top: 1.1rem;
            margin-bottom: 0.2rem;
          }
          .cv-markdown-preview ul {
            padding-left: 1.2rem;
            margin-top: 0.3rem;
            margin-bottom: 0.8rem;
          }
          .cv-markdown-preview li {
            margin-bottom: 0.25rem;
          }
          .cv-markdown-preview hr {
            border: none;
            border-top: 1px solid var(--mantine-color-default-border);
            margin: 1.2rem 0;
          }
          .cv-markdown-preview a {
            color: var(--mantine-color-blue-filled);
            text-decoration: underline;
          }
          .cv-markdown-preview code {
            background: var(--mantine-color-default-hover);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.85em;
          }
        `}</style>
      </Modal>

      {/* Modal de capture d'email (Lead Gate) avant téléchargement PDF */}
      <Modal
        opened={leadModalOpened}
        onClose={() => setLeadModalOpened(false)}
        size="sm"
        radius="lg"
        centered
        title={
          <Group gap="xs">
            <IconDownload size={20} style={{ color: 'var(--mantine-color-teal-6)' }} />
            <Text fw={700} size="md">
              Télécharger {selectedCv.title}
            </Text>
          </Group>
        }>
        <form onSubmit={handleLeadSubmit}>
          <Stack gap="md" py="xs">
            <Paper p="sm" radius="md" withBorder style={{ backgroundColor: 'var(--mantine-color-teal-light)' }}>
              <Text size="xs" style={{ lineHeight: 1.5 }}>
                Merci de saisir votre adresse email professionnelle pour télécharger la version PDF officielle et débloquer tous les accès.
              </Text>
            </Paper>

            <TextInput
              label="Adresse Email"
              placeholder="nom@entreprise.com"
              required
              type="email"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              leftSection={<IconMail size={16} />}
              autoFocus
            />

            <TextInput
              label="Votre nom & entreprise (optionnel)"
              placeholder="ex: Jean Dupont (Recruteur / Acme Corp)"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              leftSection={<IconUser size={16} />}
            />

            <Button
              type="submit"
              variant="gradient"
              gradient={{ from: 'teal.6', to: 'cyan.6', deg: 45 }}
              radius="md"
              fullWidth
              loading={isSubmittingLead}
              leftSection={<IconDownload size={16} />}
              mt="xs">
              Valider & Télécharger le PDF
            </Button>
          </Stack>
        </form>
      </Modal>
    </>
  );
}

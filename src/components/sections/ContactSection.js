'use client';

import { useEffect, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Container, Title, SimpleGrid, TextInput, Textarea, Button, Stack, Text, Group, ThemeIcon, Anchor, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconMapPin, IconBrandLinkedin, IconShieldLock } from '@tabler/icons-react';
import { features } from '@/config/features';

// Clef de site hCaptcha. Par defaut : clef de TEST publique hCaptcha
// (a remplacer par ta vraie clef via NEXT_PUBLIC_HCAPTCHA_SITEKEY).
const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001';

// Coordonnees assemblees a l'execution (jamais en clair dans le HTML statique).
const EMAIL = ['nkumbeaurelien', 'hotmail.com'].join('@');
const LINKEDIN = 'https://www.linkedin.com/in/nkaurelien/';

export default function ContactSection({ contact }) {
  const captchaEnabled = features.contactHcaptcha;
  const [mounted, setMounted] = useState(false);
  // Flag desactive : coordonnees affichees directement, envoi actif, pas de captcha.
  const [verified, setVerified] = useState(!captchaEnabled);
  const captchaRef = useRef(null);

  // hCaptcha ne se rend que cote client (evite les soucis de prerender statique).
  useEffect(() => setMounted(true), []);

  const form = useForm({
    initialValues: { name: '', email: '', subject: '', message: '' },
    validate: {
      name: v => (v.trim().length < 2 ? 'Nom requis' : null),
      email: v => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Email invalide'),
      message: v => (v.trim().length < 10 ? 'Message trop court' : null),
    },
  });

  // Export statique : pas de backend. Une fois le hCaptcha resolu, on ouvre le
  // client mail pre-rempli (mailto). L'adresse n'existe qu'apres verification.
  const handleSubmit = values => {
    if (!verified) return;
    const subject = encodeURIComponent(values.subject || `Contact de ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center" mb="xl">
        {contact?.title || 'Contact'}
      </Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
        <Stack gap="lg">
          <Text c="dimmed">{contact?.text || 'Une question, un projet ? Écrivez-moi, je vous réponds rapidement.'}</Text>

          {!verified ? (
            <Alert variant="light" color="brand" icon={<IconShieldLock size={18} />} radius="md">
              <Text fz="sm" mb="sm">
                Mes coordonnées sont protégées contre les robots. Validez le contrôle ci-dessous pour les afficher.
              </Text>
              {mounted && <HCaptcha ref={captchaRef} sitekey={SITEKEY} onVerify={() => setVerified(true)} onExpire={() => setVerified(false)} />}
            </Alert>
          ) : (
            <>
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                  <IconMail size={20} />
                </ThemeIcon>
                <Anchor href={`mailto:${EMAIL}`}>{EMAIL}</Anchor>
              </Group>
              <Group>
                <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                  <IconBrandLinkedin size={20} />
                </ThemeIcon>
                <Anchor href={LINKEDIN} target="_blank" rel="noopener noreferrer">
                  linkedin.com/in/nkaurelien
                </Anchor>
              </Group>
            </>
          )}

          <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color="brand">
              <IconMapPin size={20} />
            </ThemeIcon>
            <Text>Paris · Cergy, France</Text>
          </Group>
        </Stack>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Nom" placeholder="Votre nom" {...form.getInputProps('name')} />
            <TextInput label="Email" placeholder="vous@exemple.com" {...form.getInputProps('email')} />
            <TextInput label="Sujet" placeholder="Objet du message" {...form.getInputProps('subject')} />
            <Textarea label="Message" placeholder="Votre message…" minRows={4} autosize {...form.getInputProps('message')} />
            <Button type="submit" color="brand" radius="md" disabled={!verified}>
              Envoyer
            </Button>
            {!verified && (
              <Text fz="xs" c="dimmed">
                Validez le contrôle anti-robots (à gauche) pour activer l’envoi.
              </Text>
            )}
          </Stack>
        </form>
      </SimpleGrid>
    </Container>
  );
}

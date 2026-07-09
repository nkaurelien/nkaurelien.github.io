'use client';

import { useEffect, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import {
  Container,
  Title,
  SimpleGrid,
  Button,
  Stack,
  Text,
  Group,
  ThemeIcon,
  Anchor,
  Alert,
  Card,
  Badge,
  TextInput,
  Textarea,
  Divider,
} from '@mantine/core';
import {
  IconMail,
  IconMapPin,
  IconBrandLinkedin,
  IconShieldLock,
  IconBriefcase,
  IconCheck,
  IconPhone,
  IconBrandWhatsapp,
  IconSend,
  IconAlertCircle,
} from '@tabler/icons-react';
import { features } from '@/config/features';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

// Clef de site hCaptcha. Par defaut : clef de TEST publique hCaptcha
const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001';

// Coordonnees assemblees a l'execution (jamais en clair dans le HTML statique).
const EMAIL = ['nkumbeaurelien', 'hotmail.com'].join('@');
const LINKEDIN = 'https://www.linkedin.com/in/nkaurelien/';
const PHONE = '+33744584562';
const DISPLAY_PHONE = '+33 7 44 58 45 62';

export default function ContactSection({ contact }) {
  const captchaEnabled = features.contactHcaptcha;
  const [mounted, setMounted] = useState(false);
  const [verified, setVerified] = useState(!captchaEnabled);
  const captchaRef = useRef(null);
  const containerRef = useRef(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [captchaToken, setCaptchaToken] = useState(null);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formName || !formEmail || !formMessage) return;
    if (captchaEnabled && !captchaToken) {
      setSendError('Merci de valider le captcha avant d’envoyer.');
      return;
    }
    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      // Envoi vérifié côté serveur (hCaptcha siteverify + écriture firebase-admin).
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName, email: formEmail, message: formMessage, token: captchaToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue lors de l'envoi.");

      setSendSuccess(true);
      setFormName('');
      setFormEmail('');
      setFormMessage('');
    } catch (err) {
      setSendError(err.message || "Une erreur est survenue lors de l'envoi.");
    } finally {
      // Les tokens hCaptcha sont à usage unique -> reset après chaque envoi.
      captchaRef.current?.resetCaptcha?.();
      setCaptchaToken(null);
      if (captchaEnabled) setVerified(false);
      setSending(false);
    }
  };

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo('.contact-title', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 })
        .fromTo('.contact-left-col > *', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.12 }, '-=0.4')
        .fromTo(
          '.contact-right-card',
          { scale: 0.96, opacity: 0, y: 30 },
          { scale: 1, opacity: 1, y: 0, duration: 0.9, ease: 'back.out(1.1)' },
          '-=0.55'
        );
    },
    { scope: containerRef }
  );

  return (
    <Container ref={containerRef} size="lg" py={64} style={{ overflow: 'hidden' }}>
      <Title className="contact-title" order={1} ta="center" mb="xl">
        {contact?.title || 'Me contacter'}
      </Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
        {/* Left Column: Availabilities & Basic Info */}
        <Stack className="contact-left-col" gap="lg">
          <Text c="dimmed">
            {contact?.text || 'Vous pouvez me contacter directement pour discuter de vos projets, opportunités de recrutement ou collaborations.'}
          </Text>

          {contact?.availability?.items?.length > 0 && (
            <Card withBorder radius="lg" padding="lg">
              <Group gap="xs" mb="sm">
                <ThemeIcon size="md" radius="xl" variant="light" color="teal">
                  <IconBriefcase size={16} />
                </ThemeIcon>
                <Text fw={700}>{contact.availability.title || 'Disponibilité'}</Text>
                <Badge color="teal" variant="light" size="sm">
                  Ouvert
                </Badge>
              </Group>
              <Stack gap="xs">
                {contact.availability.items.map(item => (
                  <Group key={item} gap="xs" wrap="nowrap" align="flex-start">
                    <ThemeIcon size={18} radius="xl" variant="light" color="teal" mt={2}>
                      <IconCheck size={11} />
                    </ThemeIcon>
                    <Text fz="sm">{item}</Text>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}

          <Group align="flex-start" wrap="nowrap">
            <ThemeIcon size="lg" radius="md" variant="light" color="brand" style={{ marginTop: '2px' }}>
              <IconMapPin size={20} />
            </ThemeIcon>
            <Stack gap={2}>
              {contact?.location ? (
                contact.location.split('|').map((part, idx) => (
                  <Text key={idx} fz="sm" fw={idx === 0 ? 500 : undefined} c={idx === 0 ? undefined : 'dimmed'}>
                    {part.trim()}
                  </Text>
                ))
              ) : (
                <Text fz="sm">Paris · Île-de-France (Résidence)</Text>
              )}
            </Stack>
          </Group>
        </Stack>

        {/* Right Column: Protected Contact Info Card */}
        <Card className="contact-right-card" withBorder radius="xl" p="xl" shadow="md">
          {!verified ? (
            <Stack align="center" gap="md" py="lg" style={{ width: '100%' }}>
              <ThemeIcon size="xl" radius="md" variant="light" color="indigo">
                <IconShieldLock size={28} />
              </ThemeIcon>
              <Text fz="sm" ta="center" c="dimmed" style={{ maxWidth: 320 }}>
                Mes coordonnées et le formulaire de contact sont protégés. Validez le contrôle ci-dessous pour y accéder.
              </Text>
              {mounted && (
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={SITEKEY}
                    onVerify={token => {
                      setCaptchaToken(token);
                      setVerified(true);
                    }}
                    onExpire={() => {
                      setCaptchaToken(null);
                      setVerified(false);
                    }}
                    onError={() => {
                      setCaptchaToken(null);
                      setVerified(false);
                    }}
                  />
                </div>
              )}
            </Stack>
          ) : (
            <Stack gap="lg" style={{ width: '100%' }}>
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Stack gap="sm">
                  <Text fw={700} fz="lg">
                    {contact?.form_title || 'Envoyer un message direct'}
                  </Text>

                  {sendSuccess && (
                    <Alert icon={<IconCheck size={16} />} title="Succès" color="green" radius="md">
                      {'Votre message a été envoyé avec succès ! Je vous répondrai dès que possible.'}
                    </Alert>
                  )}

                  {sendError && (
                    <Alert icon={<IconAlertCircle size={16} />} title="Erreur" color="red" radius="md">
                      {sendError}
                    </Alert>
                  )}

                  <TextInput
                    label="Votre nom"
                    placeholder="Jean Dupont"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    required
                    disabled={sending}
                  />
                  <TextInput
                    label="Votre e-mail"
                    placeholder="jean.dupont@example.com"
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    required
                    disabled={sending}
                  />
                  <Textarea
                    label="Votre message"
                    placeholder="Bonjour, je vous contacte au sujet de..."
                    minRows={4}
                    value={formMessage}
                    onChange={e => setFormMessage(e.target.value)}
                    required
                    disabled={sending}
                  />
                  <Button type="submit" color="indigo" loading={sending} leftSection={<IconSend size={16} />} fullWidth mt="xs">
                    Envoyer le message
                  </Button>
                </Stack>
              </form>

              <Divider label="OU" labelPosition="center" my="xs" />

              <Stack gap="sm">
                <Group wrap="nowrap" className="contact-item-group">
                  <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                    <IconMail size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text fz="xs" c="dimmed" style={{ lineHeight: 1 }}>
                      Email
                    </Text>
                    <Anchor href={`mailto:${EMAIL}`} fz="sm" fw={500}>
                      {EMAIL}
                    </Anchor>
                  </Stack>
                </Group>

                <Group wrap="nowrap" className="contact-item-group">
                  <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                    <IconBrandLinkedin size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text fz="xs" c="dimmed" style={{ lineHeight: 1 }}>
                      LinkedIn
                    </Text>
                    <Anchor href={LINKEDIN} target="_blank" rel="noopener noreferrer" fz="sm" fw={500}>
                      linkedin.com/in/nkaurelien
                    </Anchor>
                  </Stack>
                </Group>

                <Group wrap="nowrap" className="contact-item-group">
                  <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                    <IconPhone size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Text fz="xs" c="dimmed" style={{ lineHeight: 1 }}>
                      {contact?.phone_label || 'Téléphone'}
                    </Text>
                    <Anchor href={`tel:${PHONE}`} fz="sm" fw={500}>
                      {DISPLAY_PHONE}
                    </Anchor>
                  </Stack>
                </Group>

                <Button
                  component="a"
                  href={`https://wa.me/${PHONE.replace('+', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="green"
                  size="md"
                  radius="xl"
                  leftSection={<IconBrandWhatsapp size={20} />}
                  mt="xs"
                  fullWidth>
                  {contact?.whatsapp_label || 'Discuter sur WhatsApp'}
                </Button>
              </Stack>
            </Stack>
          )}
        </Card>
      </SimpleGrid>
    </Container>
  );
}

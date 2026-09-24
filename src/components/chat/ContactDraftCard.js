'use client';

import { useId, useRef, useState } from 'react';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Paper, Stack, Group, Text, TextInput, Textarea, Button, Alert, useComputedColorScheme } from '@mantine/core';
import { IconMail, IconSend, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { features } from '@/config/features';

const SITEKEY = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY || '10000000-ffff-ffff-ffff-000000000001';

const LABELS = {
  fr: {
    title: 'Message pour Aurélien',
    hint: 'Préparé par Jamila : vérifiez-le, complétez-le puis envoyez-le. Rien n’est envoyé sans votre clic.',
    name: 'Votre nom',
    email: 'Votre email',
    message: 'Votre message',
    send: 'Envoyer',
    captcha: 'Merci de valider le contrôle anti-robot.',
    sent: 'Message envoyé : Aurélien vous répondra dès que possible.',
    error: 'Une erreur est survenue lors de l’envoi.',
  },
  en: {
    title: 'Message for Aurélien',
    hint: 'Drafted by Jamila: check it, complete it, then send it. Nothing is sent without your click.',
    name: 'Your name',
    email: 'Your email',
    message: 'Your message',
    send: 'Send',
    captcha: 'Please complete the anti-robot check.',
    sent: 'Message sent: Aurélien will get back to you as soon as possible.',
    error: 'Something went wrong while sending.',
  },
};

// Formulaire de contact prérempli par l'outil prepare_contact_message de Jamila.
// L'envoi reste une action du visiteur : hCaptcha puis POST /api/contact (vérifié côté serveur),
// comme la page contact. Les valeurs proposées par le modèle sont du texte brut modifiable.
export default function ContactDraftCard({ draft = {}, user, locale = 'fr' }) {
  const t = LABELS[locale === 'en' ? 'en' : 'fr'];
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const captchaRef = useRef(null);
  const titleId = useId();
  const [name, setName] = useState(draft.name || user?.displayName || '');
  const [email, setEmail] = useState(draft.email || user?.email || '');
  const [message, setMessage] = useState(draft.message || '');
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (features.contactHcaptcha && !token) {
      setError(t.captcha);
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.error);
      setStatus('sent');
      window.umami?.track('chat_contact_sent');
    } catch (err) {
      setStatus('error');
      setError(err.message || t.error);
      // Token hCaptcha à usage unique : on le réinitialise après un échec.
      captchaRef.current?.resetCaptcha?.();
      setToken(null);
    }
  };

  const sent = status === 'sent';

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      withBorder
      radius="lg"
      p="md"
      data-testid="chat-contact-card"
      aria-labelledby={titleId}
      style={{ borderInlineStart: '4px solid var(--mantine-color-kamit-filled)' }}>
      <Stack gap="sm">
        <Group gap={8} wrap="nowrap">
          <IconMail size={18} aria-hidden="true" style={{ color: 'var(--mantine-color-kamit-text)' }} />
          <Text id={titleId} fw={700} size="sm">
            {t.title}
          </Text>
        </Group>
        <Text size="xs" c="dimmed">
          {t.hint}
        </Text>

        <Group grow gap="sm" align="flex-start">
          <TextInput
            label={t.name}
            value={name}
            onChange={e => setName(e.currentTarget.value)}
            required
            disabled={sent}
            maxLength={120}
            autoComplete="name"
          />
          <TextInput
            label={t.email}
            type="email"
            value={email}
            onChange={e => setEmail(e.currentTarget.value)}
            required
            disabled={sent}
            maxLength={200}
            autoComplete="email"
          />
        </Group>
        <Textarea
          label={t.message}
          value={message}
          onChange={e => setMessage(e.currentTarget.value)}
          required
          disabled={sent}
          autosize
          minRows={3}
          maxRows={10}
          maxLength={5000}
          data-testid="chat-contact-message"
        />

        {features.contactHcaptcha && !sent && (
          <HCaptcha
            key={colorScheme}
            theme={colorScheme}
            ref={captchaRef}
            sitekey={SITEKEY}
            onVerify={setToken}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
          />
        )}

        {error && (
          <Alert color="red" radius="md" icon={<IconAlertCircle size={16} aria-hidden="true" />} role="alert">
            {error}
          </Alert>
        )}
        {sent ? (
          <Alert color="teal" radius="md" icon={<IconCheck size={16} aria-hidden="true" />} role="status" data-testid="chat-contact-sent">
            {t.sent}
          </Alert>
        ) : (
          <Group justify="flex-end">
            <Button
              type="submit"
              color="kamit"
              radius="xl"
              loading={status === 'sending'}
              leftSection={<IconSend size={16} aria-hidden="true" />}
              data-testid="chat-contact-send">
              {t.send}
            </Button>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

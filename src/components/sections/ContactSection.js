'use client';

import { Container, Title, SimpleGrid, TextInput, Textarea, Button, Stack, Text, Group, ThemeIcon } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconMail, IconMapPin, IconBrandLinkedin } from '@tabler/icons-react';

const CONTACT_EMAIL = 'nkumbeaurelien@hotmail.com';

export default function ContactSection({ contact }) {
  const form = useForm({
    initialValues: { name: '', email: '', subject: '', message: '' },
    validate: {
      name: v => (v.trim().length < 2 ? 'Nom requis' : null),
      email: v => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Email invalide'),
      message: v => (v.trim().length < 10 ? 'Message trop court' : null),
    },
  });

  // Export statique : pas de backend. On ouvre le client mail pre-rempli (mailto).
  const handleSubmit = values => {
    const subject = encodeURIComponent(values.subject || `Contact de ${values.name}`);
    const body = encodeURIComponent(`${values.message}\n\n— ${values.name} (${values.email})`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <Container size="lg" py={64}>
      <Title order={2} ta="center" mb="xl">
        {contact?.title || 'Contact'}
      </Title>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48}>
        <Stack gap="lg">
          <Text c="dimmed">{contact?.text || 'Une question, un projet ? Écrivez-moi, je vous réponds rapidement.'}</Text>
          <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color="brand">
              <IconMail size={20} />
            </ThemeIcon>
            <Text component="a" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </Text>
          </Group>
          <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color="brand">
              <IconMapPin size={20} />
            </ThemeIcon>
            <Text>Paris · Cergy, France</Text>
          </Group>
          <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color="brand">
              <IconBrandLinkedin size={20} />
            </ThemeIcon>
            <Text component="a" href="https://www.linkedin.com/in/nkaurelien/" target="_blank" rel="noopener noreferrer">
              linkedin.com/in/nkaurelien
            </Text>
          </Group>
        </Stack>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput label="Nom" placeholder="Votre nom" {...form.getInputProps('name')} />
            <TextInput label="Email" placeholder="vous@exemple.com" {...form.getInputProps('email')} />
            <TextInput label="Sujet" placeholder="Objet du message" {...form.getInputProps('subject')} />
            <Textarea label="Message" placeholder="Votre message…" minRows={4} autosize {...form.getInputProps('message')} />
            <Button type="submit" color="brand" radius="md">
              Envoyer
            </Button>
          </Stack>
        </form>
      </SimpleGrid>
    </Container>
  );
}

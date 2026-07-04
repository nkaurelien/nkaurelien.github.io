'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { Container, Title, Badge, Text, Button, Group, Stack, SimpleGrid, Image, Card, Anchor } from '@mantine/core';
import {
  IconArrowLeft,
  IconExternalLink,
  IconBrandFacebook,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandGithub,
  IconBrandGitlab,
  IconBrandInstagram,
  IconBrandYoutube,
} from '@tabler/icons-react';
import { withBase } from '@/lib/asset';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const LINK_ICONS = {
  facebook: IconBrandFacebook,
  linkedin: IconBrandLinkedin,
  twitter: IconBrandX,
  x: IconBrandX,
  github: IconBrandGithub,
  gitlab: IconBrandGitlab,
  instagram: IconBrandInstagram,
  youtube: IconBrandYoutube,
};

function linkIcon(label = '') {
  const Icon = LINK_ICONS[label.trim().toLowerCase()] || IconExternalLink;
  return <Icon size={16} />;
}

export default function ProjectDetail({ locale, project }) {
  const backLabel = locale === 'en' ? 'Back to projects' : 'Retour aux projets';
  const details = project.details;
  const carousel = project.carousel || [];
  const links = project.links || [];
  const containerRef = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo('.project-back', { x: -10, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 })
        .fromTo('.project-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.35')
        .fromTo('.project-hero-img', { scale: 0.98, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, '-=0.45')
        .fromTo('.project-description', { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.5')
        .fromTo('.project-details-card', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.45')
        .fromTo('.project-gallery-img', { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.4')
        .fromTo('.project-action-btn', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1 }, '-=0.35');
    },
    { scope: containerRef }
  );

  return (
    <Container ref={containerRef} size="md" py={48} style={{ overflow: 'hidden' }}>
      <Anchor className="project-back" component={Link} href={`/${locale}/projects`} fz="sm" c="dimmed">
        <Group gap={4} component="span">
          <IconArrowLeft size={16} /> {backLabel}
        </Group>
      </Anchor>

      <Group className="project-header" justify="space-between" align="center" mt="md" mb="lg" wrap="wrap">
        <Title order={1}>{project.title}</Title>
        <Group gap="xs" wrap="nowrap">
          {project.category && (
            <Badge size="lg" variant="light" color="brand">
              {project.category}
            </Badge>
          )}
          {project.year && (
            <Text fz="sm" fw={600} c="dimmed">
              {project.year}
            </Text>
          )}
        </Group>
      </Group>

      {project.image && <Image className="project-hero-img" src={withBase(project.image)} alt={project.title} radius="lg" mb="lg" />}

      {project.description && (
        <Text className="project-description" component="div" c="dimmed" mb="lg" dangerouslySetInnerHTML={{ __html: project.description }} />
      )}

      {details?.items?.length > 0 && (
        <Card className="project-details-card" withBorder radius="lg" padding="lg" mb="lg">
          <Text fw={700} mb="sm">
            {details.title || 'Détails du projet'}
          </Text>
          <Stack gap="xs">
            {details.items.map(item => (
              <Group key={item.label} justify="space-between" wrap="nowrap">
                <Text fz="sm" c="dimmed">
                  {item.label}
                </Text>
                <Text fz="sm" fw={500} ta="right">
                  {item.value}
                </Text>
              </Group>
            ))}
          </Stack>
        </Card>
      )}

      {carousel.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="lg">
          {carousel.map((img, i) => (
            <Image key={i} className="project-gallery-img" src={withBase(img.image)} alt={img.alt || project.title} radius="md" />
          ))}
        </SimpleGrid>
      )}

      <Group gap="sm">
        {project.link && (
          <Button
            className="project-action-btn"
            component="a"
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            color="brand"
            radius="md"
            rightSection={<IconExternalLink size={16} />}>
            {project.linkLabel}
          </Button>
        )}
        {links.map(l => (
          <Button
            key={l.url}
            className="project-action-btn"
            component="a"
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            color="brand"
            radius="md"
            leftSection={linkIcon(l.label)}>
            {l.label}
          </Button>
        ))}
      </Group>
    </Container>
  );
}

'use client';

import { Box, Group, Text, Title } from '@mantine/core';

// En-tête de section numéroté (inspiré de jev.dev) : « 02. Titre ——— », sous-titre aligné à
// gauche. Le numéro est décoratif (aria-hidden) : le titre seul est annoncé.
export default function SectionHeading({ number, title, subtitle, id, order = 2, titleClassName, subtitleClassName, mb = 48 }) {
  return (
    <Box mb={mb}>
      <Group gap="md" wrap="nowrap">
        {number && (
          <Text component="span" ff="monospace" fz="sm" c="var(--mantine-color-kamit-text)" aria-hidden="true">
            {number}
          </Text>
        )}
        <Title id={id} className={titleClassName} order={order} fz={{ base: 24, sm: 28 }} style={{ minWidth: 0 }}>
          {title}
        </Title>
        <Box aria-hidden="true" style={{ flex: 1, minWidth: 24, height: 1, backgroundColor: 'var(--mantine-color-default-border)' }} />
      </Group>
      {subtitle && (
        <Text className={subtitleClassName} c="dimmed" mt="sm" maw={680}>
          {subtitle}
        </Text>
      )}
    </Box>
  );
}

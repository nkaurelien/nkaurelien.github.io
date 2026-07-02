import { Container, SimpleGrid, Stack, Text } from '@mantine/core';

export default function Counters({ counters }) {
  const items = (counters?.items || []).filter(i => i.active !== false);

  return (
    <div className="section-muted">
      <Container size="lg" py={56}>
        <SimpleGrid cols={{ base: 1, xs: 3 }} spacing="xl">
          {items.map(item => (
            <Stack key={item.label} gap={4} align="center">
              <Text fz={44} fw={800} c="brand.6">
                {item.value}
                {item.valueAfter}
              </Text>
              <Text c="dimmed" fw={500}>
                {item.label}
              </Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </div>
  );
}

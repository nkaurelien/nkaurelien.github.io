'use client';

import { useEffect, useState } from 'react';
import { Box, Paper, Loader, Text, useComputedColorScheme } from '@mantine/core';

export default function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      if (!chart || !chart.trim()) return;

      try {
        setLoading(true);
        setError(null);

        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: colorScheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const cleanChart = chart.trim();

        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);

        if (isMounted) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err?.message || 'Erreur d’affichage du schéma Mermaid');
          setLoading(false);
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart, colorScheme]);

  if (error) {
    return (
      <Paper withBorder p="md" radius="md" my="lg" bg="var(--mantine-color-red-light)">
        <Text size="xs" c="red" fw={600} mb={4}>
          [Schéma Mermaid]
        </Text>
        <Box component="pre" style={{ margin: 0, fontSize: '13px', overflowX: 'auto' }}>
          <code>{chart}</code>
        </Box>
      </Paper>
    );
  }

  return (
    <Box
      my="lg"
      p="md"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderRadius: '12px',
        border: '1px solid var(--mantine-color-default-border)',
        overflowX: 'auto',
      }}>
      {loading ? (
        <Loader size="sm" color="blue" />
      ) : (
        <Box
          style={{ width: '100%', textAlign: 'center', overflowX: 'auto' }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </Box>
  );
}

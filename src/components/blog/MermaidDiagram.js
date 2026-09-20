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
        mermaid.parseError = () => {};
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: colorScheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          flowchart: {
            htmlLabels: true,
            useMaxWidth: true,
            padding: 20,
          },
          themeVariables: colorScheme === 'dark'
            ? {
                primaryColor: '#1e293b',
                primaryTextColor: '#f8fafc',
                primaryBorderColor: '#3b82f6',
                lineColor: '#60a5fa',
                tertiaryColor: '#0f172a',
              }
            : {
                primaryColor: '#eff6ff',
                primaryTextColor: '#1e293b',
                primaryBorderColor: '#3b82f6',
                lineColor: '#2563eb',
                tertiaryColor: '#f8fafc',
              },
        });

        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        // Remplace les \n dans les chaînes entre guillemets par des <br/> pour éviter les erreurs de syntaxe
        let cleanChart = chart.trim().replace(/\\n/g, '<br/>');

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

    const cleanMermaidDomErrors = () => {
      if (typeof document === 'undefined') return;
      document.querySelectorAll('[id^="dmermaid"], [id*="dmermaid"], .mermaid-error').forEach(el => el.remove());
    };

    renderChart().then(cleanMermaidDomErrors);

    return () => {
      isMounted = false;
      cleanMermaidDomErrors();
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
      className="mermaid-diagram-container"
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
        <>
          <Box
            style={{ width: '100%', textAlign: 'center', overflowX: 'auto' }}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <style jsx global>{`
            .mermaid-diagram-container svg {
              max-width: 100% !important;
              height: auto !important;
            }
            .mermaid-diagram-container foreignObject {
              overflow: visible !important;
            }
            .mermaid-diagram-container foreignObject > div {
              white-space: normal !important;
              word-break: break-word !important;
              text-align: center !important;
              display: inline-block !important;
              font-size: 13px !important;
              line-height: 1.35 !important;
              padding: 4px 8px !important;
            }
          `}</style>
        </>
      )}
    </Box>
  );
}

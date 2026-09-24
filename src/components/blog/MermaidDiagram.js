'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Box, Loader, Paper, Text, useComputedColorScheme } from '@mantine/core';

// Mermaid mute la config globale à chaque initialize(), donc deux rendus concurrents
// (plusieurs diagrammes sur une même page) peuvent se voler leur thème. On sérialise.
let renderQueue = Promise.resolve();

// Charte Kamitbrains (rouge, noir, blanc). edgeLabelBackground explicite : le fond gris
// par défaut du thème sombre de Mermaid (#585858) laissait les étiquettes à 4.4:1.
function themeVariables(dark) {
  return dark
    ? {
        primaryColor: '#1f1f1f',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#f6302b',
        lineColor: '#ff8f8a',
        tertiaryColor: '#141414',
        edgeLabelBackground: '#262626',
      }
    : {
        primaryColor: '#fff1f0',
        primaryTextColor: '#1e293b',
        primaryBorderColor: '#a90504',
        lineColor: '#a90504',
        tertiaryColor: '#fafafa',
        edgeLabelBackground: '#ffffff',
      };
}

export default function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [failed, setFailed] = useState(false);
  const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  // useId() produit des « : » interdits dans un sélecteur CSS, que Mermaid utilise en interne.
  const domId = `mermaid-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const latest = useRef(0);

  useEffect(() => {
    if (!chart?.trim()) return;

    const token = ++latest.current;
    const dark = colorScheme === 'dark';

    renderQueue = renderQueue.then(async () => {
      if (token !== latest.current) return;
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          // Empêche Mermaid d'injecter son SVG « bombe » dans document.body en cas d'échec.
          suppressErrorRendering: true,
          theme: dark ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          // htmlLabels: requis pour que les <br/> des libellés produisent un retour à la ligne.
          flowchart: { htmlLabels: true, useMaxWidth: true, padding: 16 },
          themeVariables: themeVariables(dark),
        });

        // parse() valide la syntaxe sans rien écrire dans le DOM : une source invalide
        // retombe sur le bloc de code brut au lieu de laisser des débris dans la page.
        await mermaid.parse(chart);
        const { svg: out } = await mermaid.render(domId, chart);
        if (token === latest.current) setSvg(out);
      } catch (err) {
        console.error('Mermaid:', err);
        if (token === latest.current) setFailed(true);
      }
    });
  }, [chart, colorScheme, domId]);

  if (failed) {
    return (
      <Paper withBorder p="md" radius="md" my="lg">
        <Text size="xs" c="dimmed" fw={600} mb={4}>
          Schéma Mermaid
        </Text>
        <Box component="pre" style={{ margin: 0, fontSize: 13, overflowX: 'auto' }}>
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
        minHeight: 80,
        backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        borderRadius: 12,
        border: '1px solid var(--mantine-color-default-border)',
        overflowX: 'auto',
      }}>
      {svg ? (
        <Box style={{ width: '100%', textAlign: 'center', overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <Loader size="sm" />
      )}
    </Box>
  );
}

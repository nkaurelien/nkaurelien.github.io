'use client';

import { useEffect, useState } from 'react';
import { Container, Box, Text } from '@mantine/core';

function decode(str = '') {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<\/?i>/g, '');
}

function renderSubtitleContent(start, end, sentence) {
  if (!sentence) return null;
  const words = sentence.split(' ');

  if (words.length <= 1) {
    return (
      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--mantine-color-teal-5)', opacity: 0.85, fontWeight: 700 }}>{decode(start)}</span>
        <span style={{ padding: '0 4px' }}>{sentence}</span>
        <span style={{ color: 'var(--mantine-color-teal-5)', opacity: 0.85, fontWeight: 700 }}>{decode(end)}</span>
      </span>
    );
  }

  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  const middleText = words.slice(1, -1).join(' ');

  return (
    <>
      <span style={{ whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--mantine-color-teal-5)', opacity: 0.85, fontWeight: 700 }}>{decode(start)}</span>
        <span style={{ paddingLeft: 4 }}>{firstWord}</span>
      </span>
      {middleText ? ` ${middleText} ` : ' '}
      <span style={{ whiteSpace: 'nowrap' }}>
        {lastWord}
        <span style={{ color: 'var(--mantine-color-teal-5)', opacity: 0.85, fontWeight: 700, paddingLeft: 4 }}>{decode(end)}</span>
      </span>
    </>
  );
}

export default function CodeBanner({ hero }) {
  const rotates = hero?.subtitle?.rotates || [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (rotates.length < 2) return undefined;
    const id = setInterval(() => setIndex(i => (i + 1) % rotates.length), 2600);
    return () => clearInterval(id);
  }, [rotates.length]);

  if (!rotates || rotates.length === 0) return null;

  return (
    <Box component="div" style={{ position: 'relative', zIndex: 30, width: '100%', marginTop: '-32px', marginBottom: '16px' }}>
      <Container size="lg">
        <Box
          py={14}
          px={{ base: 18, sm: 30 }}
          style={{
            maxWidth: 800,
            margin: '0 auto',
            position: 'relative',
            zIndex: 30,
            background: 'light-dark(rgba(255, 255, 255, 0.98), rgba(15, 23, 42, 0.96))',
            border: '2px solid rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 24px 50px rgba(15, 23, 42, 0.35), 0 10px 25px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
          }}>
          <Text
            fz={{ base: 14, sm: 16 }}
            fw={600}
            c="var(--mantine-color-text)"
            style={{ lineHeight: '1.45', fontFamily: 'var(--mantine-font-family-monospace, monospace)' }}>
            <span key={index} className="rotate-text-anim">
              {renderSubtitleContent(hero?.subtitle?.start, hero?.subtitle?.end, rotates[index])}
            </span>
          </Text>
        </Box>
      </Container>
    </Box>
  );
}

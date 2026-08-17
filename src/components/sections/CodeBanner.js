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
    <Box
      component="section"
      pb={{ base: 40, md: 54 }}
      pt={{ base: 10, md: 15 }}
      style={{
        position: 'relative',
        background: 'linear-gradient(180deg, #534be8 0%, rgba(99, 102, 241, 0.75) 25%, rgba(99, 102, 241, 0.15) 65%, var(--mantine-color-body) 100%)',
        marginTop: '-2px',
        overflow: 'hidden',
      }}>
      <Container size="lg">
        <Box
          py={16}
          px={{ base: 20, sm: 32 }}
          style={{
            maxWidth: 820,
            margin: '0 auto',
            background: 'light-dark(rgba(255, 255, 255, 0.92), rgba(26, 27, 30, 0.92))',
            border: '1.5px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '24px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(99, 102, 241, 0.15)',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s ease',
          }}>
          <Text
            fz={{ base: 14, sm: 17 }}
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

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
      py={20}
      style={{
        background: 'var(--mantine-color-body)',
        borderTop: '1px solid var(--mantine-color-default-border)',
        borderBottom: '1px solid var(--mantine-color-default-border)',
      }}>
      <Container size="lg">
        <Box
          py={14}
          px={24}
          style={{
            maxWidth: 820,
            margin: '0 auto',
            background: 'var(--mantine-color-default-hover)',
            border: '1px solid var(--mantine-color-default-border)',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
          }}>
          <Text
            fz={{ base: 14, sm: 17 }}
            fw={600}
            c="var(--mantine-color-text)"
            style={{ lineHeight: '1.4', fontFamily: 'monospace, var(--mantine-font-family)' }}>
            <span key={index} className="rotate-text-anim">
              {renderSubtitleContent(hero?.subtitle?.start, hero?.subtitle?.end, rotates[index])}
            </span>
          </Text>
        </Box>
      </Container>
    </Box>
  );
}

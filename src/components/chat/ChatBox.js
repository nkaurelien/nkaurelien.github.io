import { useState } from 'react';
import { ScrollArea, Stack, Paper, Group, Avatar, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconUser, IconRobot, IconThumbUp, IconThumbDown, IconCopy, IconCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper to safely extract text content from both content (assistant) and parts (user) properties
const getMessageText = message => {
  if (!message) return '';

  if (message.content) {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.content)) {
      return message.content
        .map(part => {
          if (!part) return '';
          if (typeof part === 'string') return part;
          if (typeof part === 'object') return part.text || '';
          return '';
        })
        .join('');
    }
  }

  if (Array.isArray(message.parts)) {
    return message.parts
      .map(part => {
        if (!part) return '';
        if (part.type === 'text') return part.text || '';
        return '';
      })
      .join('');
  }

  return '';
};

export default function ChatBox({ messages = [], user, responseLoading, viewportRef, locale = 'fr' }) {
  const clipboard = useClipboard({ timeout: 2000 });
  const [copiedId, setCopiedId] = useState(null);
  const [ratings, setRatings] = useState({});

  const handleRateMessage = (id, ratingType) => {
    setRatings(prev => ({
      ...prev,
      [id]: prev[id] === ratingType ? null : ratingType,
    }));
  };

  const handleCopy = (id, text) => {
    clipboard.copy(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(current => (current === id ? null : current)), 2000);
  };

  const isEnglish = locale === 'en';
  const labels = {
    userLabel: user ? user.displayName || user.email?.split('@')[0] : isEnglish ? 'Visitor' : 'Visiteur',
    aiLabel: isEnglish ? 'Jamila (AI)' : 'Jamila (IA)',
    copy: isEnglish ? 'Copy' : 'Copier',
    copied: isEnglish ? 'Copied!' : 'Copié !',
    helpful: isEnglish ? 'Helpful' : 'Utile',
    notHelpful: isEnglish ? 'Not helpful' : 'Pas utile',
  };

  return (
    <ScrollArea
      style={{ flex: 1, minHeight: 0, paddingRight: '10px' }}
      h="calc(100dvh - 200px)"
      viewportRef={viewportRef}
      type="auto"
      scrollbarSize={6}>
      <Stack gap="md" py="md">
        {messages.map(message => {
          const isUser = message.role === 'user';
          const messageText = getMessageText(message);
          const isCopied = copiedId === message.id;
          return (
            <Stack key={message.id} gap={6} style={{ width: '100%' }}>
              <Paper
                withBorder
                p="md"
                radius="lg"
                style={{
                  backgroundColor: isUser ? 'var(--mantine-color-default-hover)' : 'var(--mantine-color-blue-light)',
                  borderColor: isUser ? 'var(--mantine-color-default-border)' : 'var(--mantine-color-blue-light-border)',
                }}>
                <Group align="flex-start" gap="sm" wrap="nowrap">
                  {isUser ? (
                    <Avatar src={user?.photoURL} radius="xl" size="md" color="gray" variant="filled">
                      {!user?.photoURL && <IconUser size={18} />}
                    </Avatar>
                  ) : (
                    <Avatar radius="xl" size="md" color="blue" variant="filled">
                      <IconRobot size={18} />
                    </Avatar>
                  )}

                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Text fw={600} size="sm" style={{ lineHeight: 1.1 }}>
                      {isUser ? labels.userLabel : labels.aiLabel}
                    </Text>
                    {isUser ? (
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, wordBreak: 'break-word' }}>
                        {messageText}
                      </Text>
                    ) : (
                      <div className="chat-prose" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
                      </div>
                    )}
                  </Stack>
                </Group>
              </Paper>

              {/* Interactive Action Row for AI Responses (excluding the welcome root message) */}
              {!isUser && message.id !== 'welcome' && (
                <Group gap={4} px="md" style={{ color: 'var(--mantine-color-dimmed)' }}>
                  <Tooltip label={labels.helpful} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color={ratings[message.id] === 'up' ? 'blue' : 'gray'}
                      onClick={() => handleRateMessage(message.id, 'up')}
                      size="sm">
                      <IconThumbUp size={14} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={labels.notHelpful} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color={ratings[message.id] === 'down' ? 'red' : 'gray'}
                      onClick={() => handleRateMessage(message.id, 'down')}
                      size="sm">
                      <IconThumbDown size={14} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={isCopied ? labels.copied : labels.copy} withArrow>
                    <ActionIcon variant="subtle" color={isCopied ? 'teal' : 'gray'} onClick={() => handleCopy(message.id, messageText)} size="sm">
                      {isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </Stack>
          );
        })}

        {/* Loading Indicator */}
        {responseLoading && (
          <Paper
            withBorder
            p="md"
            radius="lg"
            style={{
              backgroundColor: 'var(--mantine-color-blue-light)',
              borderColor: 'var(--mantine-color-blue-light-border)',
              alignSelf: 'flex-start',
              width: '100%',
            }}>
            <Group align="flex-start" gap="sm" wrap="nowrap">
              <Avatar radius="xl" size="md" color="blue" variant="filled">
                <IconRobot size={18} />
              </Avatar>
              <Stack gap={4} style={{ flex: 1 }}>
                <Text fw={600} size="sm" style={{ lineHeight: 1.1 }}>
                  {labels.aiLabel}
                </Text>
                <Group gap={6} py="xs">
                  <span className="dot-typing" />
                  <span className="dot-typing" />
                  <span className="dot-typing" />
                </Group>
              </Stack>
            </Group>
          </Paper>
        )}
      </Stack>
    </ScrollArea>
  );
}

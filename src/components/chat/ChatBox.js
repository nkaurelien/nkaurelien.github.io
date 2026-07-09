import { ScrollArea, Stack, Paper, Group, Avatar, Text, Tooltip, ActionIcon } from '@mantine/core';
import { IconUser, IconRobot, IconThumbUp, IconThumbDown, IconCopy, IconCheck } from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';

// Helper to safely extract text content from both string and Vercel AI SDK multi-part formats
const getMessageText = (content) => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map(part => {
        if (!part) return '';
        if (typeof part === 'string') return part;
        if (typeof part === 'object') {
          return part.text || '';
        }
        return '';
      })
      .join('');
  }
  return '';
};

export default function ChatBox({ messages, isLoading, ratings, onRateMessage, t, viewportRef }) {
  const clipboard = useClipboard({ timeout: 2000 });

  return (
    <ScrollArea
      style={{ flex: 1, paddingRight: '10px', height: '100%' }}
      viewportRef={viewportRef}
      type="auto"
    >
      <Stack gap="lg" py="md">
        {messages.map(message => {
          const isUser = message.role === 'user';
          return (
            <Stack key={message.id} gap="xs" style={{ width: '100%' }}>
              <Paper
                withBorder
                p="md"
                radius="md"
                style={{
                  backgroundColor: isUser
                    ? 'var(--mantine-color-gray-light)'
                    : 'var(--mantine-color-blue-light)',
                  borderColor: isUser
                    ? 'var(--mantine-color-gray-light-border)'
                    : 'var(--mantine-color-blue-light-border)',
                }}
              >
                <Group align="flex-start" gap="sm" wrap="nowrap">
                  {isUser ? (
                    <Avatar radius="xl" size="md" color="gray" variant="filled">
                      <IconUser size={18} />
                    </Avatar>
                  ) : (
                    <Avatar radius="xl" size="md" color="blue" variant="filled">
                      <IconRobot size={18} />
                    </Avatar>
                  )}

                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text fw={600} size="sm" style={{ lineHeight: 1.1 }}>
                      {isUser ? t.userLabel : t.aiLabel}
                    </Text>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {getMessageText(message.content)}
                    </Text>
                  </Stack>
                </Group>
              </Paper>

              {/* Interactive Action Row for AI Responses (excluding the welcome root message) */}
              {!isUser && message.id !== 'welcome' && (
                <Group gap="xs" px="md" style={{ color: 'var(--mantine-color-dimmed)' }}>
                  <Tooltip label={t.copy === 'Copy' ? 'Helpful' : 'Utile'}>
                    <ActionIcon
                      variant="subtle"
                      color={ratings[message.id] === 'up' ? 'blue' : 'gray'}
                      onClick={() => onRateMessage(message.id, 'up')}
                      size="sm"
                    >
                      <IconThumbUp size={14} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={t.copy === 'Copy' ? 'Not helpful' : 'Pas utile'}>
                    <ActionIcon
                      variant="subtle"
                      color={ratings[message.id] === 'down' ? 'red' : 'gray'}
                      onClick={() => onRateMessage(message.id, 'down')}
                      size="sm"
                    >
                      <IconThumbDown size={14} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={clipboard.copied ? t.copied : t.copy}>
                    <ActionIcon
                      variant="subtle"
                      color={clipboard.copied ? 'teal' : 'gray'}
                      onClick={() => clipboard.copy(getMessageText(message.content))}
                      size="sm"
                    >
                      {clipboard.copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </Stack>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <Paper
            withBorder
            p="md"
            radius="md"
            style={{
              backgroundColor: 'var(--mantine-color-blue-light)',
              borderColor: 'var(--mantine-color-blue-light-border)',
              alignSelf: 'flex-start',
              width: '100%',
            }}
          >
            <Group align="flex-start" gap="sm" wrap="nowrap">
              <Avatar radius="xl" size="md" color="blue" variant="filled">
                <IconRobot size={18} />
              </Avatar>
              <Stack gap="xs" style={{ flex: 1 }}>
                <Text fw={600} size="sm" style={{ lineHeight: 1.1 }}>
                  {t.aiLabel}
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

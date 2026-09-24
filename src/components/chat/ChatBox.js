import { useState } from 'react';
import Link from 'next/link';
import { ScrollArea, Stack, Paper, Group, Avatar, Text, Tooltip, ActionIcon, Anchor } from '@mantine/core';
import { IconUser, IconRobot, IconThumbUp, IconThumbDown, IconCopy, IconCheck, IconArticle, IconArrowUpRight } from '@tabler/icons-react';
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

// Articles du blog cités dans une réponse (liens markdown vers /blog/… ou /fr|en/blog/…),
// affichés en « cartes de sources » sous la réponse. Dédoublonnés, préfixés par la locale.
const SOURCE_LINK_RE = /\[([^\]]+)\]\(((?:\/(?:fr|en))?\/blog\/[^)\s]+)\)/g;
export const extractSources = (markdown, locale) => {
  const seen = new Set();
  const sources = [];
  for (const [, title, rawHref] of markdown.matchAll(SOURCE_LINK_RE)) {
    const href = /^\/(fr|en)\//.test(rawHref) ? rawHref : `/${locale}${rawHref}`;
    if (seen.has(href)) continue;
    seen.add(href);
    sources.push({ title: title.replace(/[*_`]/g, '').trim(), href });
  }
  return sources;
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
    conversation: isEnglish ? 'Conversation with Jamila' : 'Conversation avec Jamila',
    reply: isEnglish ? 'reply' : 'réponse',
    sources: isEnglish ? 'Cited articles' : 'Articles cités',
  };

  let replyCount = 0;

  return (
    <ScrollArea
      style={{ flex: 1, minHeight: 0, paddingRight: '10px' }}
      h="calc(100dvh - 200px)"
      viewportRef={viewportRef}
      type="auto"
      scrollbarSize={6}>
      {/* Journal de conversation : role="log" annonce les nouveaux messages (poliment) ;
          aria-busy pendant le streaming évite de lire la réponse morceau par morceau. */}
      <Stack gap="md" py="md" id="chat-log" role="log" aria-label={labels.conversation} aria-busy={responseLoading} data-testid="chat-log">
        {messages.map(message => {
          const isUser = message.role === 'user';
          // Numéro de réponse de Jamila : distingue les boutons d'action d'une réponse à l'autre.
          replyCount += isUser ? 0 : 1;
          const replyName = `${labels.reply} ${replyCount}`;
          const messageText = getMessageText(message);
          const isCopied = copiedId === message.id;
          const sources = isUser ? [] : extractSources(messageText, locale);
          return (
            <Stack
              key={message.id}
              component="article"
              aria-labelledby={`msg-${message.id}-author`}
              data-testid="chat-message"
              data-role={message.role}
              gap={6}
              // Bulles de conversation : visiteur à droite (largeur limitée), Jamila à gauche.
              style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: isUser ? '85%' : '100%', width: isUser ? 'auto' : '100%' }}>
              <Paper
                withBorder
                p="md"
                radius="lg"
                className={isUser ? 'chat-bubble chat-bubble-user' : 'chat-bubble chat-bubble-ai'}
                style={{
                  backgroundColor: isUser ? 'var(--mantine-color-indigo-light)' : 'var(--mantine-color-default-hover)',
                  borderColor: isUser ? 'var(--mantine-color-indigo-light-hover)' : 'var(--mantine-color-default-border)',
                }}>
                <Group align="flex-start" gap="sm" wrap="nowrap" style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  {isUser ? (
                    <Avatar src={user?.photoURL} alt="" aria-hidden="true" radius="xl" size="md" color="gray" variant="filled">
                      {!user?.photoURL && <IconUser size={18} aria-hidden="true" />}
                    </Avatar>
                  ) : (
                    <Avatar radius="xl" size="md" color="indigo" variant="filled" aria-hidden="true">
                      <IconRobot size={18} aria-hidden="true" />
                    </Avatar>
                  )}

                  <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                    <Text id={`msg-${message.id}-author`} fw={600} size="sm" ta={isUser ? 'right' : undefined} style={{ lineHeight: 1.1 }}>
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

              {/* Cartes de sources : articles du blog cités dans la réponse. */}
              {sources.length > 0 && (
                <Stack component="ul" role="list" aria-label={labels.sources} className="list-reset" data-testid="chat-sources" gap={6} pl="xs">
                  {sources.map(source => (
                    <li key={source.href}>
                      <Anchor component={Link} href={source.href} underline="never" className="chat-source-card" data-testid="chat-source-card">
                        <IconArticle size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--mantine-color-indigo-filled)' }} />
                        <Text component="span" size="sm" fw={600} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                          {source.title}
                        </Text>
                        <IconArrowUpRight size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
                      </Anchor>
                    </li>
                  ))}
                </Stack>
              )}

              {/* Interactive Action Row for AI Responses (excluding the welcome root message) */}
              {!isUser && message.id !== 'welcome' && (
                <Group gap={4} px="md" style={{ color: 'var(--mantine-color-dimmed)' }}>
                  <Tooltip label={labels.helpful} withArrow>
                    <ActionIcon
                      aria-label={`${labels.helpful} (${replyName})`}
                      aria-pressed={ratings[message.id] === 'up'}
                      data-testid="chat-feedback-up"
                      variant="subtle"
                      color={ratings[message.id] === 'up' ? 'blue' : 'gray'}
                      onClick={() => {
                        handleRateMessage(message.id, 'up');
                        if (typeof window !== 'undefined') {
                          window.umami?.track('chat_feedback_thumb_up', { messageId: message.id });
                        }
                      }}
                      size="sm">
                      <IconThumbUp size={14} aria-hidden="true" />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={labels.notHelpful} withArrow>
                    <ActionIcon
                      aria-label={`${labels.notHelpful} (${replyName})`}
                      aria-pressed={ratings[message.id] === 'down'}
                      data-testid="chat-feedback-down"
                      variant="subtle"
                      color={ratings[message.id] === 'down' ? 'red' : 'gray'}
                      onClick={() => {
                        handleRateMessage(message.id, 'down');
                        if (typeof window !== 'undefined') {
                          window.umami?.track('chat_feedback_thumb_down', { messageId: message.id });
                        }
                      }}
                      size="sm">
                      <IconThumbDown size={14} aria-hidden="true" />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={isCopied ? labels.copied : labels.copy} withArrow>
                    <ActionIcon
                      aria-label={`${labels.copy} (${replyName})`}
                      data-testid="chat-copy"
                      variant="subtle"
                      color={isCopied ? 'teal' : 'gray'}
                      onClick={() => handleCopy(message.id, messageText)}
                      size="sm">
                      {isCopied ? <IconCheck size={14} aria-hidden="true" /> : <IconCopy size={14} aria-hidden="true" />}
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
            aria-hidden="true"
            data-testid="chat-typing"
            withBorder
            p="md"
            radius="lg"
            style={{
              backgroundColor: 'var(--mantine-color-default-hover)',
              borderColor: 'var(--mantine-color-default-border)',
              alignSelf: 'flex-start',
              width: '100%',
            }}>
            <Group align="flex-start" gap="sm" wrap="nowrap">
              <Avatar radius="xl" size="md" color="blue" variant="filled">
                <IconRobot size={18} aria-hidden="true" />
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

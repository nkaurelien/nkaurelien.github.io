import { useState } from 'react';
import Link from 'next/link';
import { ScrollArea, Stack, Paper, Group, Avatar, Text, Tooltip, ActionIcon, Anchor, Loader } from '@mantine/core';
import {
  IconUser,
  IconRobot,
  IconThumbUp,
  IconThumbDown,
  IconCopy,
  IconCheck,
  IconArticle,
  IconArrowUpRight,
  IconSearch,
  IconList,
  IconBook,
  IconTool,
  IconMail,
} from '@tabler/icons-react';
import { useClipboard } from '@mantine/hooks';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContactDraftCard from './ContactDraftCard';

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

// Slug lisible : sans le préfixe de date du fichier (2025-05-12-…).
const shortSlug = (slug = '') => slug.replace(/^\d{4}-\d{2}-\d{2}-/, '');

// Appels d'outils de Jamila (parties « data-tool » du flux) : libellé lisible par outil.
const TOOL_STEPS = {
  search_articles: { Icon: IconSearch, fr: i => `Recherche dans les articles : « ${i.query} »`, en: i => `Searching articles: “${i.query}”` },
  list_articles: {
    Icon: IconList,
    fr: i => `Liste des articles${i.tag ? ` (tag ${i.tag})` : ''}`,
    en: i => `Listing articles${i.tag ? ` (tag ${i.tag})` : ''}`,
  },
  prepare_contact_message: { Icon: IconMail, fr: () => "Préparation d'un message pour Aurélien", en: () => 'Drafting a message for Aurélien' },
  read_article: { Icon: IconBook, fr: i => `Lecture de l'article « ${shortSlug(i.slug)} »`, en: i => `Reading article “${shortSlug(i.slug)}”` },
};
export const getToolSteps = (message, locale = 'fr') =>
  (message?.parts || [])
    .filter(part => part?.type === 'data-tool' && part.data?.name)
    .map((part, idx) => {
      const step = TOOL_STEPS[part.data.name];
      const input = part.data.input || {};
      return {
        key: part.id || `${part.data.name}-${idx}`,
        Icon: step?.Icon || IconTool,
        label: step ? step[locale === 'en' ? 'en' : 'fr'](input) : part.data.name,
      };
    });

// Étapes d'outils affichées en tête de réponse : en cours (loader) tant que le texte
// n'a pas commencé, puis validées (coche) et discrètes.
function ToolSteps({ steps, running, label }) {
  if (steps.length === 0) return null;
  return (
    <Stack component="ul" gap={4} className="list-reset" aria-label={label} data-testid="chat-tool-steps" mb={6}>
      {steps.map(({ key, Icon, label: stepLabel }, idx) => {
        const active = running && idx === steps.length - 1;
        return (
          <Group component="li" key={key} gap={6} wrap="nowrap" data-testid="chat-tool-step" data-state={active ? 'running' : 'done'}>
            {active ? (
              <Loader size={12} color="kamit" aria-hidden="true" />
            ) : (
              <IconCheck size={13} aria-hidden="true" style={{ color: 'var(--mantine-color-teal-text)' }} />
            )}
            <Icon size={14} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }} />
            <Text component="span" size="xs" c="dimmed" style={{ minWidth: 0 }} truncate>
              {stepLabel}
            </Text>
          </Group>
        );
      })}
    </Stack>
  );
}

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
    steps: isEnglish ? 'Steps taken by Jamila' : 'Étapes suivies par Jamila',
  };

  // Réponse en cours de streaming : dernier message de Jamila pendant le chargement. Ses
  // étapes d'outils remplacent alors l'indicateur « en train d'écrire » séparé.
  const lastMessage = messages[messages.length - 1];
  const streamingId = responseLoading && lastMessage?.role === 'assistant' ? lastMessage.id : null;

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
          const toolSteps = isUser ? [] : getToolSteps(message, locale);
          const isStreaming = message.id === streamingId;
          // Brouillon de message préparé par l'outil prepare_contact_message (le dernier du tour).
          const contactDraft = isUser
            ? null
            : (message.parts || []).filter(part => part?.type === 'data-tool' && part.data?.name === 'prepare_contact_message').pop();
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
                  backgroundColor: isUser ? 'var(--mantine-color-kamit-light)' : 'var(--mantine-color-default-hover)',
                  borderColor: isUser ? 'var(--mantine-color-kamit-light-hover)' : 'var(--mantine-color-default-border)',
                }}>
                <Group align="flex-start" gap="sm" wrap="nowrap" style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}>
                  {isUser ? (
                    <Avatar src={user?.photoURL} alt="" aria-hidden="true" radius="xl" size="md" color="gray" variant="filled">
                      {!user?.photoURL && <IconUser size={18} aria-hidden="true" />}
                    </Avatar>
                  ) : (
                    <Avatar radius="xl" size="md" color="kamit" variant="filled" aria-hidden="true">
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
                      <>
                        <ToolSteps steps={toolSteps} running={isStreaming && !messageText} label={labels.steps} />
                        {isStreaming && !messageText && toolSteps.length === 0 && (
                          <Group gap={6} py="xs" aria-hidden="true">
                            <span className="dot-typing" />
                            <span className="dot-typing" />
                            <span className="dot-typing" />
                          </Group>
                        )}
                        {messageText && (
                          <div className="chat-prose" style={{ fontSize: '14px', lineHeight: 1.6 }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{messageText}</ReactMarkdown>
                          </div>
                        )}
                      </>
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
                        <IconArticle size={16} aria-hidden="true" style={{ flexShrink: 0, color: 'var(--mantine-color-kamit-filled)' }} />
                        <Text component="span" size="sm" fw={600} lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                          {source.title}
                        </Text>
                        <IconArrowUpRight size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
                      </Anchor>
                    </li>
                  ))}
                </Stack>
              )}

              {contactDraft && <ContactDraftCard key={contactDraft.id} draft={contactDraft.data.input} user={user} locale={locale} />}

              {/* Interactive Action Row for AI Responses (excluding the welcome root message) */}
              {!isUser && message.id !== 'welcome' && (
                <Group gap={4} px="md" style={{ color: 'var(--mantine-color-dimmed)' }}>
                  <Tooltip label={labels.helpful} withArrow>
                    <ActionIcon
                      aria-label={`${labels.helpful} (${replyName})`}
                      aria-pressed={ratings[message.id] === 'up'}
                      data-testid="chat-feedback-up"
                      variant="subtle"
                      color={ratings[message.id] === 'up' ? 'kamit' : 'gray'}
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
        {responseLoading && !streamingId && (
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
              <Avatar radius="xl" size="md" color="kamit" variant="filled">
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

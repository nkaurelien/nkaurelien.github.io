'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Text,
  TextInput,
  ActionIcon,
  ScrollArea,
  Group,
  Stack,
  Title,
  Badge,
  Tooltip,
  SimpleGrid,
  UnstyledButton,
  Box,
} from '@mantine/core';
import { IconSend, IconTrash, IconRobot, IconUser, IconMessage2Code, IconSparkles } from '@tabler/icons-react';

const TRANSLATIONS = {
  fr: {
    title: 'Assistant IA — Aurélien',
    description: 'Posez vos questions sur mon parcours, mes compétences et mes projets. Je réponds à partir de ma base de connaissances (RAG).',
    placeholder: 'Posez votre question en langage naturel...',
    send: 'Envoyer',
    clear: 'Nouvelle conversation',
    statusOnline: 'Disponible',
    userLabel: 'Vous',
    aiLabel: 'Aurélien (IA)',
    tip: 'Astuce : Cliquez sur une suggestion ci-dessus pour démarrer instantanément.',
    welcome: "Bonjour ! Je suis le jumeau numérique d'Aurélien. Que puis-je faire pour vous aujourd'hui ?",
    suggestions: [
      'Quels sont tes projets en IA et RAG ?',
      'Parle-moi de ton parcours chez Koree.',
      'Comment as-tu conçu Livraison Express chez MCS ?',
      'Quelles sont tes compétences DevSecOps ?',
    ],
  },
  en: {
    title: 'AI Assistant — Aurélien',
    description: 'Ask questions about my journey, skills, and projects. I answer using a semantic knowledge base (RAG).',
    placeholder: 'Ask your question in natural language...',
    send: 'Send',
    clear: 'New conversation',
    statusOnline: 'Online',
    userLabel: 'You',
    aiLabel: 'Aurélien (AI)',
    tip: 'Tip: Click on a suggestion above to start instantly.',
    welcome: "Hello! I am Aurélien's AI twin. How can I help you today?",
    suggestions: [
      'What are your AI and RAG projects?',
      'Tell me about your journey at Koree.',
      'How did you build Livraison Express at MCS?',
      'What are your DevSecOps skills?',
    ],
  },
};

export default function ChatClient({ locale }) {
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;

  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    content: t.welcome,
  };

  const { messages, input, handleInputChange, handleSubmit, setInput, setMessages, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [welcomeMessage],
  });

  const viewportRef = useRef(null);

  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Submit suggestion immediately on click
  const handleSuggestionClick = async suggestion => {
    setInput(suggestion);
    // Submit in next tick to allow setInput state to propagate
    setTimeout(() => {
      const event = new Event('submit', { cancelable: true, bubbles: true });
      const form = document.querySelector('#chat-form');
      if (form) {
        form.dispatchEvent(event);
      }
    }, 50);
  };

  const handleClearChat = () => {
    setMessages([welcomeMessage]);
    setInput('');
  };

  // Determine if the conversation has active exchanges beyond the initial welcome message
  const hasExchanges = messages.length > 1;

  return (
    <Container size="md" py="xl" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 100px)', position: 'relative' }}>
      {/* Top Header Row */}
      <Group justify="space-between" mb="xl" align="center">
        <Group gap="xs">
          <IconMessage2Code size={24} style={{ color: 'var(--mantine-color-blue-filled)' }} />
          <Text fw={700} size="sm" c="dimmed">
            {t.title}
          </Text>
        </Group>
        <Group gap="xs">
          <Badge color="green" variant="dot" size="md">
            {t.statusOnline}
          </Badge>
          {hasExchanges && (
            <Tooltip label={t.clear}>
              <ActionIcon variant="subtle" color="gray" onClick={handleClearChat} size="md" radius="md">
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '100px' }}>
        {!hasExchanges ? (
          // 1. Centered Landing View (Like Smart Data Pay)
          <Stack align="center" justify="center" gap="xl" style={{ flex: 1, marginTop: '5vh' }}>
            <Stack align="center" gap="xs">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(34, 139, 230, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}>
                <IconRobot size={36} style={{ color: 'var(--mantine-color-blue-filled)' }} />
              </div>
              <Title order={2} ta="center">
                {t.title}
              </Title>
              <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: '520px', lineHeight: 1.5 }}>
                {t.description}
              </Text>
            </Stack>

            {/* Suggestions Grid (2x2) */}
            <Stack style={{ width: '100%', maxWidth: '640px' }} gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {t.suggestions.map((suggestion, index) => (
                  <UnstyledButton key={index} onClick={() => handleSuggestionClick(suggestion)} style={{ height: '100%' }}>
                    <Paper
                      withBorder
                      p="md"
                      radius="md"
                      style={{
                        height: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                      className="suggestion-card">
                      <Group gap="xs" align="flex-start" wrap="nowrap">
                        <IconSparkles size={16} style={{ color: 'var(--mantine-color-blue-filled)', marginTop: '2px', flexShrink: 0 }} />
                        <Text size="xs" fw={500} style={{ lineHeight: 1.4 }}>
                          {suggestion}
                        </Text>
                      </Group>
                    </Paper>
                  </UnstyledButton>
                ))}
              </SimpleGrid>

              <Text size="11px" c="dimmed" ta="center" mt="xs">
                {t.tip}
              </Text>
            </Stack>
          </Stack>
        ) : (
          // 2. Chat Timeline View (Messages Stream)
          <ScrollArea style={{ flex: 1, paddingRight: '10px', height: '100%' }} viewportRef={viewportRef} type="auto">
            <Stack gap="lg" py="md">
              {messages.map(message => {
                const isUser = message.role === 'user';
                return (
                  <Group key={message.id} justify={isUser ? 'flex-end' : 'flex-start'} align="flex-start" gap="xs">
                    {!isUser && (
                      <ActionIcon variant="light" color="blue" radius="xl" size="md" style={{ marginTop: '4px' }}>
                        <IconRobot size={16} />
                      </ActionIcon>
                    )}
                    <div style={{ maxWidth: '75%' }}>
                      <Paper
                        p="md"
                        radius="lg"
                        style={{
                          backgroundColor: isUser ? 'var(--mantine-color-blue-filled)' : 'rgba(255, 255, 255, 0.05)',
                          color: isUser ? '#fff' : 'inherit',
                          border: isUser ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderTopLeftRadius: !isUser ? '0' : 'lg',
                          borderTopRightRadius: isUser ? '0' : 'lg',
                        }}>
                        <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                          {message.content}
                        </Text>
                      </Paper>
                      <Text size="10px" c="dimmed" ta={isUser ? 'right' : 'left'} mt={4} px={4}>
                        {isUser ? t.userLabel : t.aiLabel}
                      </Text>
                    </div>
                    {isUser && (
                      <ActionIcon variant="light" color="gray" radius="xl" size="md" style={{ marginTop: '4px' }}>
                        <IconUser size={16} />
                      </ActionIcon>
                    )}
                  </Group>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <Group justify="flex-start" align="center" gap="xs">
                  <ActionIcon variant="light" color="blue" radius="xl" size="md">
                    <IconRobot size={16} />
                  </ActionIcon>
                  <Paper
                    p="sm"
                    radius="lg"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderTopLeftRadius: '0',
                    }}>
                    <Group gap={6}>
                      <span className="dot-typing" />
                      <span className="dot-typing" />
                      <span className="dot-typing" />
                    </Group>
                  </Paper>
                </Group>
              )}
            </Stack>
          </ScrollArea>
        )}
      </div>

      {/* 3. Bottom Centered Fixed Input Bar using Mantine Box */}
      <Box
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '800px',
          paddingLeft: 'var(--mantine-spacing-md)',
          paddingRight: 'var(--mantine-spacing-md)',
          zIndex: 100,
        }}>
        <form id="chat-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
          <TextInput
            value={input}
            onChange={handleInputChange}
            placeholder={t.placeholder}
            radius="xl"
            size="lg"
            leftSection={<IconRobot size={20} style={{ color: 'var(--mantine-color-blue-filled)', marginLeft: '12px' }} />}
            rightSection={
              <ActionIcon type="submit" color="blue" size="lg" radius="xl" disabled={!input?.trim() || isLoading} style={{ marginRight: '6px' }}>
                <IconSend size={16} />
              </ActionIcon>
            }
            styles={{
              input: {
                backgroundColor: 'var(--mantine-color-body)',
                border: '1px solid var(--mantine-color-default-border)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.08)',
                color: 'inherit',
                paddingLeft: '48px',
                paddingRight: '48px',
                height: '54px',
                '&:focus': {
                  borderColor: 'var(--mantine-color-blue-filled)',
                  boxShadow: '0 0 12px rgba(34, 139, 230, 0.25), 0 8px 32px rgba(0, 0, 0, 0.15)',
                },
              },
              section: {
                pointerEvents: 'none',
              },
            }}
          />
        </form>
      </Box>

      {/* Global CSS hover animations */}
      <style jsx global>{`
        .suggestion-card:hover {
          transform: translateY(-2px);
          border-color: var(--mantine-color-blue-filled) !important;
          box-shadow: 0 4px 12px rgba(34, 139, 230, 0.1);
          background-color: rgba(34, 139, 230, 0.03) !important;
        }
        .dot-typing {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: var(--mantine-color-blue-filled);
          display: inline-block;
          animation: dot-flashing 1.4s infinite linear;
          opacity: 0.2;
        }
        .dot-typing:nth-child(2) {
          animation-delay: 0.2s;
        }
        .dot-typing:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes dot-flashing {
          0% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.2;
            transform: scale(1);
          }
        }
      `}</style>
    </Container>
  );
}

'use client';

import { useChat as useChatSdk } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Container, Text, Group, Stack, Title, Badge, Tooltip, ActionIcon, SimpleGrid, UnstyledButton, Paper } from '@mantine/core';
import { IconTrash, IconRobot, IconMessage2Code, IconSparkles } from '@tabler/icons-react';

// Modular components (SDP style)
import ChatBox from '@/components/chat/ChatBox';
import ChatInput from '@/components/chat/ChatInput';
import { useAuth } from '@/context/AuthContext';

const TRANSLATIONS = {
  fr: {
    title: 'Assistant IA — Jamila',
    description: 'Posez vos questions sur mon parcours, mes compétences et mes projets. Je réponds à partir de ma base de connaissances (RAG).',
    placeholder: 'Posez votre question en langage naturel...',
    send: 'Envoyer',
    clear: 'Nouvelle conversation',
    statusOnline: 'Disponible',
    userLabel: 'Vous',
    aiLabel: 'Jamila (IA)',
    tip: 'Astuce : Cliquez sur une suggestion ci-dessus pour démarrer instantanément.',
    welcome: "Bonjour ! Je suis Jamila, l'assistante IA d'Aurélien. Que puis-je faire pour vous aujourd'hui ?",
    copy: 'Copier',
    copied: 'Copié !',
    suggestions: [
      'Quels sont tes projets en IA et RAG ?',
      'Parle-moi de ton parcours chez Koree.',
      'Comment as-tu conçu Livraison Express chez MCS ?',
      'Quelles sont tes compétences DevSecOps ?',
    ],
  },
  en: {
    title: 'AI Assistant — Jamila',
    description: 'Ask questions about my journey, skills, and projects. I answer using a semantic knowledge base (RAG).',
    placeholder: 'Ask your question in natural language...',
    send: 'Send',
    clear: 'New conversation',
    statusOnline: 'Online',
    userLabel: 'You',
    aiLabel: 'Jamila (AI)',
    tip: 'Tip: Click on a suggestion above to start instantly.',
    welcome: "Hello! I am Jamila, Aurélien's AI assistant. How can I help you today?",
    copy: 'Copy',
    copied: 'Copied!',
    suggestions: [
      'What are your AI and RAG projects?',
      'Tell me about your journey at Koree.',
      'How did you build Livraison Express at MCS?',
      'What are your DevSecOps skills?',
    ],
  },
};

// Custom adapter hook to emulate the older Vercel AI SDK useChat signature on top of version 4.x
const useChat = ({ api, initialMessages }) => {
  const [input, setInput] = useState('');
  const {
    messages,
    setMessages,
    sendMessage: sdkSendMessage,
    status,
  } = useChatSdk({
    api,
    initialMessages,
  });

  const handleInputChange = e => {
    setInput(e.target.value);
  };

  const handleSubmit = e => {
    if (e && e.preventDefault) e.preventDefault();
    if (!input.trim()) return;

    sdkSendMessage({ text: input });
    setInput('');
  };

  const isLoading = status === 'streaming' || status === 'submitted';

  return {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    sdkSendMessage, // exposed for instant suggestion clicks
  };
};

export default function ChatClient({ locale }) {
  const t = TRANSLATIONS[locale] || TRANSLATIONS.fr;
  const { user } = useAuth();

  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    content: t.welcome,
  };

  const apiEndPoint = '/api/chat/';

  // 1. Hook initialized exactly like your ChatbotView
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: chatEndpointIsLoading,
    setMessages,
    sdkSendMessage,
  } = useChat({
    initialMessages: [welcomeMessage],
    api: apiEndPoint,
  });

  // 2. SendMessage wrapper exactly like your ChatbotView
  const sendMessage = async e => {
    e.preventDefault();
    handleSubmit(e);
    setInput('');
  };

  const viewportRef = useRef(null);

  // Scroll to bottom when messages stream
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
  }, [messages, chatEndpointIsLoading]);

  const handleSuggestionClick = suggestion => {
    if (chatEndpointIsLoading) return;
    sdkSendMessage({ text: suggestion });
  };

  const handleClearChat = () => {
    setMessages([welcomeMessage]);
    setInput('');
  };

  // Switch to the conversation view as soon as the user sends something or a fetch starts,
  // so the first suggestion click immediately shows the question + loading state.
  const hasExchanges = chatEndpointIsLoading || messages.some(m => m.role === 'user');

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
              <ActionIcon variant="subtle" color="gray" onClick={handleClearChat} size="md" radius="md" disabled={chatEndpointIsLoading}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingBottom: '100px' }}>
        {!hasExchanges ? (
          // Landing suggestions view (SmartDataPay Style)
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
                  <UnstyledButton
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    style={{ height: '100%' }}
                    disabled={chatEndpointIsLoading}>
                    <Paper
                      withBorder
                      p="md"
                      radius="md"
                      style={{
                        height: '100%',
                        backgroundColor: 'var(--mantine-color-default)',
                        transition: 'all 0.2s ease',
                        cursor: chatEndpointIsLoading ? 'not-allowed' : 'pointer',
                        opacity: chatEndpointIsLoading ? 0.5 : 1,
                        pointerEvents: chatEndpointIsLoading ? 'none' : 'auto',
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
          // 3. Render exact SDP Box
          <ChatBox messages={messages} user={user} responseLoading={chatEndpointIsLoading} viewportRef={viewportRef} locale={locale} />
        )}
      </div>

      {/* 4. Render exact SDP Input */}
      <ChatInput
        placeholder={t.placeholder}
        input={input}
        setInput={setInput}
        sendMessage={sendMessage}
        handleInputChange={handleInputChange}
        isLoading={chatEndpointIsLoading}
      />

      {/* Global CSS hover animations */}
      <style jsx global>{`
        .suggestion-card:hover {
          transform: translateY(-2px);
          border-color: var(--mantine-color-blue-filled) !important;
          box-shadow: 0 4px 12px rgba(34, 139, 230, 0.1);
          background-color: rgba(34, 139, 230, 0.03) !important;
        }
        /* Markdown rendering for AI messages — theme-aware, no Tailwind dependency */
        .chat-prose > :first-child {
          margin-top: 0;
        }
        .chat-prose > :last-child {
          margin-bottom: 0;
        }
        .chat-prose p {
          margin: 0 0 0.6em;
        }
        .chat-prose ul,
        .chat-prose ol {
          margin: 0 0 0.6em;
          padding-left: 1.25em;
        }
        .chat-prose li {
          margin: 0.2em 0;
        }
        .chat-prose a {
          color: var(--mantine-color-blue-filled);
          text-decoration: underline;
        }
        .chat-prose code {
          font-family: var(--mantine-font-family-monospace);
          font-size: 0.85em;
          padding: 0.1em 0.35em;
          border-radius: 4px;
          background-color: var(--mantine-color-default-hover);
        }
        .chat-prose pre {
          margin: 0 0 0.6em;
          padding: 0.75em 1em;
          border-radius: 8px;
          overflow-x: auto;
          background-color: var(--mantine-color-default-hover);
        }
        .chat-prose pre code {
          padding: 0;
          background: transparent;
        }
        .chat-prose blockquote {
          margin: 0 0 0.6em;
          padding-left: 0.9em;
          border-left: 3px solid var(--mantine-color-blue-light-border);
          color: var(--mantine-color-dimmed);
        }
        .chat-prose table {
          border-collapse: collapse;
          margin: 0 0 0.6em;
          font-size: 0.9em;
        }
        .chat-prose th,
        .chat-prose td {
          border: 1px solid var(--mantine-color-default-border);
          padding: 0.35em 0.6em;
          text-align: left;
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

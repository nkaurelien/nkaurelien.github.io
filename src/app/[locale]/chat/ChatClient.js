'use client';

import { useChat as useChatSdk } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Container, Text, Group, Stack, Title, Tooltip, SimpleGrid, UnstyledButton, Paper, Button, Avatar, Menu } from '@mantine/core';
import { IconPlus, IconRobot, IconSparkles, IconBrandGoogle, IconLogout } from '@tabler/icons-react';

// Modular components (SDP style)
import ChatBox from '@/components/chat/ChatBox';
import ChatInput from '@/components/chat/ChatInput';
import { useAuth } from '@/context/AuthContext';

const TRANSLATIONS = {
  fr: {
    title: 'Assistant IA — Jamila',
    description: 'Posez vos questions sur mon parcours, mes compétences et mes projets. Je réponds à partir de ma base de connaissances (RAG).',
    placeholder: 'Posez votre question en langage naturel...',
    inputLabel: 'Votre question pour Jamila',
    suggestionsLabel: 'Questions suggérées',
    send: 'Envoyer',
    clear: 'Nouvelle conversation',
    scope: 'Répond à partir de mes articles et de mon profil.',
    userLabel: 'Vous',
    aiLabel: 'Jamila (IA)',
    tip: 'Astuce : Cliquez sur une suggestion ci-dessus pour démarrer instantanément.',
    privacy:
      "Assistante IA. Vos messages sont traités par une IA pour répondre à partir d'une base de connaissances publique sur Aurélien. Ne partagez pas d'informations personnelles ou sensibles.",
    welcome: "Bonjour ! Je suis Jamila, l'assistante IA d'Aurélien. Que puis-je faire pour vous aujourd'hui ?",
    copy: 'Copier',
    copied: 'Copié !',
    signIn: 'Se présenter',
    signInHint: 'Connectez-vous pour préremplir le formulaire de contact.',
    signOut: 'Se déconnecter',
    suggestions: [
      'Liste ses 5 derniers articles de blog.',
      'Qui est Astrid-Aurélien NKUMBE ?',
      'Quels sont ses projets en IA et RAG ?',
      'Sur quoi travaille-t-il chez DATA2INNOV ?',
      'Quelles sont ses compétences DevSecOps ?',
      'Parle-moi de son parcours (Koree, Smart Data Pay...).',
      'Résume son article sur Kaniko.',
      'Comment le contacter ou prendre rendez-vous ?',
    ],
  },
  en: {
    title: 'AI Assistant — Jamila',
    description: 'Ask questions about my journey, skills, and projects. I answer using a semantic knowledge base (RAG).',
    placeholder: 'Ask your question in natural language...',
    inputLabel: 'Your question for Jamila',
    suggestionsLabel: 'Suggested questions',
    send: 'Send',
    clear: 'New conversation',
    scope: 'Answers from my articles and my profile.',
    userLabel: 'You',
    aiLabel: 'Jamila (AI)',
    tip: 'Tip: Click on a suggestion above to start instantly.',
    privacy:
      'AI assistant. Your messages are processed by an AI to answer from a public knowledge base about Aurélien. Please do not share personal or sensitive information.',
    welcome: "Hello! I am Jamila, Aurélien's AI assistant. How can I help you today?",
    copy: 'Copy',
    copied: 'Copied!',
    signIn: 'Introduce yourself',
    signInHint: 'Sign in to pre-fill the contact form.',
    signOut: 'Sign out',
    suggestions: [
      'List his 5 latest blog articles.',
      'Who is Astrid-Aurélien NKUMBE?',
      'What are his AI and RAG projects?',
      'What is he working on at DATA2INNOV?',
      'What are his DevSecOps skills?',
      'Tell me about his career (Koree, Smart Data Pay...).',
      'Summarize his article about Kaniko.',
      'How can I contact him or book a meeting?',
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
  const { user, signInWithGoogle, signOutUser } = useAuth();

  const handleGuestSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Guest sign-in failed:', err);
    }
  };

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
      {/* Titre de page (h1) toujours présent ; visible sur l'écran d'accueil, lu par les
          lecteurs d'écran pendant la conversation. */}
      {hasExchanges && (
        <h1 className="visually-hidden" data-testid="chat-title">
          {t.title}
        </h1>
      )}

      {/* Barre de conversation (seulement pendant un échange ; l'écran d'accueil commence
          directement par le titre) : périmètre des réponses + nouvelle conversation. */}
      {hasExchanges && (
        <Group justify="space-between" mb="md" align="center" wrap="nowrap" data-testid="chat-bar">
          <Text size="xs" c="dimmed">
            {t.scope}
          </Text>
          <Button
            variant="default"
            size="xs"
            radius="xl"
            leftSection={<IconPlus size={14} aria-hidden="true" />}
            onClick={handleClearChat}
            disabled={chatEndpointIsLoading}
            data-testid="chat-clear">
            {t.clear}
          </Button>
        </Group>
      )}

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
                  backgroundColor: 'rgba(169, 5, 4, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '10px',
                }}>
                <IconRobot size={36} aria-hidden="true" style={{ color: 'var(--mantine-color-kamit-filled)' }} />
              </div>
              <Title order={1} ta="center" data-testid="chat-title">
                {t.title}
              </Title>
              <Text size="sm" c="dimmed" ta="center" style={{ maxWidth: '520px', lineHeight: 1.5 }}>
                {t.description}
              </Text>

              {/* Identité invité (centrée) : préremplit ensuite le formulaire de contact. */}
              {user ? (
                <Menu position="bottom" shadow="md" width={220} withinPortal>
                  <Menu.Target>
                    <UnstyledButton>
                      <Group gap={8} wrap="nowrap" mt="xs">
                        <Avatar src={user.photoURL || undefined} size={28} radius="xl" color="kamit">
                          {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <Text size="sm" fw={500} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.displayName || user.email}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</Menu.Label>
                    <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={() => signOutUser().catch(() => {})}>
                      {t.signOut}
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <Tooltip label={t.signInHint}>
                  <Button
                    size="sm"
                    radius="xl"
                    variant="light"
                    color="kamit"
                    leftSection={<IconBrandGoogle size={16} />}
                    onClick={handleGuestSignIn}
                    mt="xs">
                    {t.signIn}
                  </Button>
                </Tooltip>
              )}
            </Stack>

            {/* Suggestions Grid (2x2) */}
            <Stack style={{ width: '100%', maxWidth: '640px' }} gap="md">
              {/* Liste sémantique (role="list" : Safari retire la sémantique d'un ul en grille). */}
              <SimpleGrid
                component="ul"
                role="list"
                aria-label={t.suggestionsLabel}
                className="list-reset"
                data-testid="chat-suggestions"
                cols={{ base: 1, sm: 2 }}
                spacing="md">
                {t.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <UnstyledButton
                      type="button"
                      data-testid="chat-suggestion"
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{ height: '100%', width: '100%' }}
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
                          <IconSparkles
                            size={16}
                            aria-hidden="true"
                            style={{ color: 'var(--mantine-color-kamit-filled)', marginTop: '2px', flexShrink: 0 }}
                          />
                          <Text size="xs" fw={500} style={{ lineHeight: 1.4 }}>
                            {suggestion}
                          </Text>
                        </Group>
                      </Paper>
                    </UnstyledButton>
                  </li>
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
        privacyNotice={t.privacy}
        label={t.inputLabel}
        sendLabel={t.send}
      />

      {/* Global CSS hover animations */}
      <style jsx global>{`
        .suggestion-card:hover {
          transform: translateY(-2px);
          border-color: var(--mantine-color-kamit-filled) !important;
          box-shadow: 0 4px 12px rgba(169, 5, 4, 0.1);
          background-color: rgba(169, 5, 4, 0.03) !important;
        }
        /* Markdown rendering for AI messages — theme-aware, no Tailwind dependency */
        /* Bulles de conversation : coin « de départ » moins arrondi, comme une messagerie. */
        .chat-bubble-user {
          border-end-end-radius: 4px !important;
        }
        .chat-bubble-ai {
          border-end-start-radius: 4px !important;
        }
        /* Cartes de sources (articles cités) : bordure gauche d'accent. */
        .chat-source-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--mantine-color-default-border);
          border-inline-start: 3px solid var(--mantine-color-kamit-filled);
          border-radius: 0.5rem;
          background-color: var(--mantine-color-body);
          color: var(--mantine-color-text);
          transition:
            border-color 0.15s ease,
            transform 0.15s ease;
        }
        .chat-source-card:hover {
          border-color: var(--mantine-color-kamit-filled);
          transform: translateX(2px);
        }
        .chat-source-card:focus-visible {
          outline: 3px solid var(--mantine-color-kamit-filled);
          outline-offset: 2px;
        }
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
          /* kamit-text : s'adapte au thème (rouge foncé en clair, rouge clair en sombre). */
          color: var(--mantine-color-kamit-text);
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
          border-left: 3px solid var(--mantine-color-kamit-light-border);
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
          background-color: var(--mantine-color-kamit-filled);
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

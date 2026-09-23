import { Box, TextInput, ActionIcon, Text } from '@mantine/core';
import { IconRobot, IconSend } from '@tabler/icons-react';

export default function ChatInput({
  placeholder,
  input,
  setInput,
  sendMessage,
  handleInputChange,
  isLoading,
  privacyNotice,
  label = 'Votre question',
  sendLabel = 'Envoyer',
}) {
  return (
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
      <form
        id="chat-form"
        data-testid="chat-form"
        aria-busy={isLoading}
        onSubmit={e => {
          if (typeof window !== 'undefined' && input?.trim()) {
            window.umami?.track('chat_query_submit', { length: input.trim().length });
          }
          sendMessage(e);
        }}
        style={{ width: '100%' }}>
        {/* Libellé réel du champ (le placeholder ne suffit pas), visible des seuls lecteurs d'écran. */}
        <label htmlFor="chat-input" className="visually-hidden">
          {label}
        </label>
        <TextInput
          id="chat-input"
          name="message"
          data-testid="chat-input"
          autoComplete="off"
          enterKeyHint="send"
          // description : Mantine relie l'aide au champ (aria-describedby) ; masquée visuellement,
          // le même texte étant affiché sous le formulaire (aria-hidden pour ne pas le lire 2 fois).
          description={privacyNotice}
          descriptionProps={{ className: 'visually-hidden' }}
          value={input}
          onChange={handleInputChange}
          placeholder={placeholder}
          radius="xl"
          size="lg"
          disabled={isLoading}
          leftSectionPointerEvents="none"
          rightSectionPointerEvents="auto"
          leftSection={<IconRobot size={20} aria-hidden="true" style={{ color: 'var(--mantine-color-blue-filled)', marginLeft: '12px' }} />}
          rightSection={
            <ActionIcon
              type="submit"
              aria-label={sendLabel}
              data-testid="chat-send"
              color="blue"
              size="lg"
              radius="xl"
              variant="filled"
              disabled={isLoading}
              style={{ marginRight: '6px' }}>
              <IconSend size={16} aria-hidden="true" />
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
            },
          }}
        />
      </form>
      {privacyNotice && (
        <Text aria-hidden="true" data-testid="chat-privacy" size="10px" c="dimmed" ta="center" mt={6} style={{ lineHeight: 1.3, opacity: 0.85 }}>
          {privacyNotice}
        </Text>
      )}
    </Box>
  );
}

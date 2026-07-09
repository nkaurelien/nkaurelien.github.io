import { Box, TextInput, ActionIcon } from '@mantine/core';
import { IconRobot, IconSend } from '@tabler/icons-react';

export default function ChatInput({ input, onChange, onSubmit, placeholder, isLoading }) {
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
      <form id="chat-form" onSubmit={onSubmit} style={{ width: '100%' }}>
        <TextInput
          value={input}
          onChange={onChange}
          placeholder={placeholder}
          radius="xl"
          size="lg"
          leftSectionPointerEvents="none"
          rightSectionPointerEvents="auto"
          leftSection={<IconRobot size={20} style={{ color: 'var(--mantine-color-blue-filled)', marginLeft: '12px' }} />}
          rightSection={
            <ActionIcon type="submit" color="blue" size="lg" radius="xl" variant="filled" style={{ marginRight: '6px' }}>
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
          }}
        />
      </form>
    </Box>
  );
}

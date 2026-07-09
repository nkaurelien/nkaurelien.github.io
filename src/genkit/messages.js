// Helpers d'extraction de texte des messages (partagés route <-> flow).

// Extrait le texte d'une valeur `content` (string, ou tableau de string/{text}).
export const contentToText = value => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    return value
      .map(part => {
        if (!part) return '';
        if (typeof part === 'string') return part;
        if (typeof part === 'object') return part.text || '';
        return '';
      })
      .join('');
  }
  return '';
};

// Extrait le texte d'un message dans l'un ou l'autre format :
// - legacy `{ content: string | array }`
// - Vercel AI SDK v5 UI message `{ parts: [{ type: 'text', text }] }`
export const getMessageText = message => {
  if (!message) return '';
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return contentToText(message);
  if (message.content !== undefined && message.content !== null) return contentToText(message.content);
  if (Array.isArray(message.parts)) {
    return message.parts.map(part => (part && part.type === 'text' ? part.text || '' : '')).join('');
  }
  return '';
};

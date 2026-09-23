'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { A2uiSurface, MarkdownContext, basicCatalog } from '@a2ui/react/v0_9';
import { injectStyles } from '@a2ui/react/styles';
import { renderMarkdown } from '@a2ui/markdown-it';

// Rendu des surfaces A2UI (UI générative, preview) d'un message de Jamila.
// Chargé côté client uniquement (next/dynamic, ssr: false) depuis ChatBox.
//
// Sécurité : l'UI vient du modèle -> contenu NON fiable. Les Text passent par
// @a2ui/markdown-it (HTML assaini) ; le prompt interdit Image et champs de saisie.

let stylesInjected = false;

export default function A2uiMessage({ envelopes, onAction }) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  // Un processor par message ; les actions (clic sur Button) remontent au chat.
  const [processor] = useState(() => new MessageProcessor([basicCatalog], action => onActionRef.current?.(action)));
  const [surfaces, setSurfaces] = useState([]);
  const processedCount = useRef(0);

  useEffect(() => {
    if (!stylesInjected) {
      injectStyles();
      stylesInjected = true;
    }
  }, []);

  useEffect(() => {
    const sync = () => setSurfaces(Array.from(processor.model.surfacesMap.values()));
    const created = processor.onSurfaceCreated(sync);
    const deleted = processor.onSurfaceDeleted(sync);
    return () => {
      created.unsubscribe();
      deleted.unsubscribe();
    };
  }, [processor]);

  // Les enveloppes arrivent en streaming : on ne traite que les nouvelles.
  useEffect(() => {
    const fresh = envelopes.slice(processedCount.current);
    if (fresh.length === 0) return;
    processedCount.current = envelopes.length;
    try {
      processor.processMessages(fresh);
    } catch (err) {
      console.error('[a2ui] enveloppe ignorée :', err);
    }
  }, [envelopes, processor]);

  if (surfaces.length === 0) return null;

  return (
    <MarkdownContext.Provider value={renderMarkdown}>
      <div className="chat-a2ui">
        {surfaces.map(surface => (
          <A2uiSurface key={surface.id} surface={surface} />
        ))}
      </div>
      {/* Variables A2UI alignées sur le thème Mantine (clair/sombre) */}
      <style jsx global>{`
        .chat-a2ui {
          margin-top: 0.75em;
          --a2ui-color-background: transparent;
          --a2ui-color-on-background: var(--mantine-color-text);
          --a2ui-color-surface: var(--mantine-color-body);
          --a2ui-color-on-surface: var(--mantine-color-text);
          --a2ui-card-background: var(--mantine-color-body);
          --a2ui-card-border: 1px solid var(--mantine-color-default-border);
          --a2ui-card-box-shadow: none;
          --a2ui-card-margin: 0.4em 0;
        }
        .chat-a2ui a {
          color: var(--mantine-color-blue-filled);
          text-decoration: underline;
        }
        .chat-a2ui p {
          margin: 0.2em 0;
        }
      `}</style>
    </MarkdownContext.Provider>
  );
}

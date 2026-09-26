'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import MermaidDiagram from './MermaidDiagram';
import { withBase } from '@/lib/asset';

// react-markdown rend un bloc clôturé en <pre><code class="language-x">. On intercepte
// au niveau du <pre> : remplacer le <code> laisserait le <pre> parent autour du diagramme.
function codeChild(children) {
  const child = Array.isArray(children) ? children[0] : children;
  return child?.props ? child.props : null;
}

export default function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        // Images du markdown : chemins /img/... servis depuis public/, préfixés par le basePath.
        img({ node, src, alt, ...props }) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              src={withBase(src)}
              alt={alt || ''}
              loading="lazy"
              style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
          );
        },
        pre({ children, ...props }) {
          const inner = codeChild(children);
          const lang = /language-(\w+)/.exec(inner?.className || '')?.[1];

          if (lang === 'mermaid') {
            return <MermaidDiagram chart={String(inner.children).replace(/\n$/, '')} />;
          }

          return (
            <pre {...props} style={{ borderRadius: 8, padding: 12, overflowX: 'auto' }}>
              {children}
            </pre>
          );
        },
      }}>
      {content}
    </ReactMarkdown>
  );
}

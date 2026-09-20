'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import MermaidDiagram from './MermaidDiagram';

export default function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');

          if (lang === 'mermaid' || (!lang && !inline && (codeString.startsWith('flowchart') || codeString.startsWith('graph')))) {
            return <MermaidDiagram chart={codeString} />;
          }

          if (inline || !match) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }

          return (
            <pre className={className} style={{ borderRadius: '8px', padding: '12px', overflowX: 'auto' }}>
              <code {...props}>{children}</code>
            </pre>
          );
        },
      }}>
      {content}
    </ReactMarkdown>
  );
}

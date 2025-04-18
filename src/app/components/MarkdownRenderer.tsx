'use client'

import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return match ? (
            <SyntaxHighlighter
              // @ts-ignore
              style={vscDarkPlus as { [key: string]: React.CSSProperties }}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },
        // Style other markdown elements
        p: ({ children }) => <p className="mb-4 text-black">{children}</p>,
        h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-black">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mb-3 text-black">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-bold mb-2 text-black">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-black">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-black">{children}</ol>,
        li: ({ children }) => <li className="mb-1 text-black">{children}</li>,
        a: ({ children, href }) => (
          <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4 text-black">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
} 
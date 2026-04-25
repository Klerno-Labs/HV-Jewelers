import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from '@/lib/cn'
import { sanitizeSchema } from '@/lib/editorial/markdown'

/**
 * Renders a sanitized markdown body in the brand's editorial typography.
 * Server-only (no 'use client') — react-markdown runs on the server and
 * the output is plain HTML, zero client JS.
 */
export function EditorialProse({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn('max-w-[68ch]', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          h2: (props) => (
            <h2
              {...props}
              className="mt-12 mb-5 font-serif text-heading text-ink"
            />
          ),
          h3: (props) => (
            <h3
              {...props}
              className="mt-10 mb-4 font-serif text-title text-ink"
            />
          ),
          p: (props) => (
            <p
              {...props}
              className="mb-5 text-body leading-[1.75] text-ink-soft"
            />
          ),
          a: ({ href, ...props }) => (
            <a
              {...props}
              href={href}
              rel={
                href && /^https?:\/\//.test(href)
                  ? 'noopener noreferrer nofollow'
                  : undefined
              }
              target={href && /^https?:\/\//.test(href) ? '_blank' : undefined}
              className="text-ink underline underline-offset-4 decoration-bronze/50 transition-colors hover:text-olive hover:decoration-olive"
            />
          ),
          strong: (props) => (
            <strong {...props} className="font-medium text-ink" />
          ),
          em: (props) => (
            <em {...props} className="font-serif text-ink" />
          ),
          blockquote: (props) => (
            <blockquote
              {...props}
              className="my-8 border-l border-bronze pl-6 font-serif text-subtitle italic leading-relaxed text-ink-soft"
            />
          ),
          ul: (props) => (
            <ul
              {...props}
              className="mb-5 list-['·_'] space-y-2 pl-6 text-body leading-[1.75] text-ink-soft"
            />
          ),
          ol: (props) => (
            <ol
              {...props}
              className="mb-5 list-decimal space-y-2 pl-6 text-body leading-[1.75] text-ink-soft"
            />
          ),
          li: (props) => <li {...props} className="pl-1" />,
          hr: () => (
            <hr className="mx-auto my-12 w-16 border-0 border-t border-bronze/40" />
          ),
          code: (props) => (
            <code
              {...props}
              className="rounded-sm bg-limestone px-1.5 py-0.5 font-mono text-[0.85em] text-ink"
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

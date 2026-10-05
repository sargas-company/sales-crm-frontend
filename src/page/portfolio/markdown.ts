import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * Render Markdown → sanitized HTML safe to inject with
 * dangerouslySetInnerHTML. Script tags, inline event handlers and
 * unknown schemes are stripped by DOMPurify.
 */
export function renderMarkdown(src: string): string {
	const dirty = marked.parse(src ?? '', { async: false }) as string
	return DOMPurify.sanitize(dirty, {
		ADD_ATTR: ['target', 'rel'],
	})
}

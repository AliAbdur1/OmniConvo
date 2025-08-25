import type { Conversation } from '@/types/conversation';
import { JSDOM } from 'jsdom';
import sanitizeHtml from 'sanitize-html';

/**
 * Extracts a Claude share page into a structured Conversation.
 */
export async function parseClaude(html: string): Promise<Conversation> {
  if (!html?.trim()) {
    throw new Error('Empty or invalid HTML content');
  }

  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Find all message elements (Claude uses .message class)
    const messages = doc.querySelectorAll('.message');
    
    if (!messages.length) {
      throw new Error('No messages found in conversation');
    }

    // Clean and format the content
    const cleanContent = sanitizeHtml(html, {
      allowedTags: ['p', 'br', 'strong', 'em', 'code', 'pre'],
      allowedAttributes: {}
    });

    return {
      model: 'Claude',
      content: cleanContent,
      scrapedAt: new Date().toISOString(),
      sourceHtmlBytes: html.length,
      messageCount: messages.length
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Claude conversation: ${errorMessage}`);
  }
}

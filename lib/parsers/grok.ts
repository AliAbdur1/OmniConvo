import type { Conversation } from '@/types/conversation';
import { JSDOM } from 'jsdom';
import sanitizeHtml from 'sanitize-html';

/**
 * Extracts a Grok share page into a structured Conversation.
 * @param html - Raw HTML content from the Grok share page
 * @returns Promise resolving to a structured Conversation object
 */
export async function parseGrok(html: string): Promise<Conversation> {
  if (!html?.trim()) {
    throw new Error('Empty or invalid HTML content');
  }

  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Find all message elements (Grok uses .message-item class)
    const messages = doc.querySelectorAll('.message-item');
    
    if (!messages.length) {
      throw new Error('No messages found in conversation');
    }

    // Clean and format the content
    const cleanContent = sanitizeHtml(html, {
      allowedTags: ['p', 'br', 'strong', 'em', 'code', 'pre'],
      allowedAttributes: {}
    });

    return {
      model: 'Grok',
      content: cleanContent,
      scrapedAt: new Date().toISOString(),
      sourceHtmlBytes: html.length,
      messageCount: messages.length
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse Grok conversation: ${errorMessage}`);
  }
}

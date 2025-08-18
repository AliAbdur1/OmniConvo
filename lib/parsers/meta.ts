import type { Conversation } from '@/types/conversation';

/**
 * Extracts a Meta share page into a structured Conversation.
 */
export async function parseMeta(html: string): Promise<Conversation> {
  // Create a DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find the main conversation div
  const conversationDiv = doc.querySelector('div[class*="xdt5ytf x2lwn1j"]');
  
  if (!conversationDiv) {
    throw new Error('Could not find conversation content');
  }

  const conversationHtml = conversationDiv.outerHTML;

  return {
    model: 'Meta',
    content: conversationHtml,
    scrapedAt: new Date().toISOString(),
    sourceHtmlBytes: conversationHtml.length,
  };
}

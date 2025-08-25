import type { Conversation } from '@/types/conversation';
import sanitizeHtml from 'sanitize-html';
import { JSDOM } from 'jsdom';

/**
 * Extracts a Meta share page into a structured Conversation.
 */
interface Message {
  type: 'user' | 'ai';
  content: string;
}

export async function parseMeta(html: string): Promise<Conversation> {
  if (!html?.trim()) {
    throw new Error('Empty or invalid HTML content');
  }

  try {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

  // Find all message divs
  const messages: Message[] = [];
  const messageDivs = doc.querySelectorAll('div.html-div.xdj266r');

  if (!messageDivs.length) {
    throw new Error('No messages found in conversation');
  }

  messageDivs.forEach((div: Element) => {
    // Check if this is a user message
    const userSpan = div.querySelector('span.x1lliihq.x1plvlek');
    if (userSpan) {
      messages.push({
        type: 'user',
        content: sanitizeHtml(userSpan.innerHTML, {
          allowedTags: ['p', 'br', 'strong', 'em', 'code', 'pre'],
          allowedAttributes: {}
        })
      });
    } else {
      // AI message
      messages.push({
        type: 'ai',
        content: sanitizeHtml(div.innerHTML, {
          allowedTags: ['p', 'br', 'strong', 'em', 'code', 'pre'],
          allowedAttributes: {}
        })
      });
    }
  });

  // Format messages into conversation content
  const formattedContent = messages.map(msg => 
    `${msg.type === 'user' ? 'User: ' : 'AI: '}${msg.content}\n`
  ).join('\n');

  if (!messages.length) {
    throw new Error('Failed to extract any valid messages');
  }

  return {
    model: 'Meta',
    content: formattedContent,
    scrapedAt: new Date().toISOString(),
    sourceHtmlBytes: html.length,
    messageCount: messages.length
  };
} catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to parse Meta conversation: ${errorMessage}`);
}
}

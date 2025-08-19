import type { Conversation } from '@/types/conversation';

/**
 * Extracts a Meta share page into a structured Conversation.
 */
export async function parseMeta(html: string): Promise<Conversation> {
  // Debug log
  console.log('Received HTML:', html.substring(0, 500));

  // Find the main content div
  const mainDivStart = html.indexOf('role="main"');
  if (mainDivStart === -1) {
    throw new Error('Could not find conversation content');
  }

  // Walk back to find start of main div
  let divStart = mainDivStart;
  while (divStart >= 0 && html[divStart] !== '<') {
    divStart--;
  }

  // Find the matching closing div by counting opening/closing tags
  let depth = 1;
  let divEnd = mainDivStart;
  
  while (depth > 0 && divEnd < html.length) {
    divEnd++;
    if (html.slice(divEnd, divEnd + 4) === '</div') depth--;
    if (html.slice(divEnd, divEnd + 4) === '<div') depth++;
  }

  // Find the end of the closing tag
  while (divEnd < html.length && html[divEnd] !== '>') {
    divEnd++;
  }

  const conversationHtml = html.slice(divStart, divEnd + 1);

  return {
    model: 'Meta',
    content: conversationHtml,
    scrapedAt: new Date().toISOString(),
    sourceHtmlBytes: conversationHtml.length,
  };
}

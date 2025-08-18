import type { Conversation } from '@/types/conversation';

/**
 * Extracts a Meta share page into a structured Conversation.
 */
export async function parseMeta(html: string): Promise<Conversation> {
  // Find the div with our target classes
  const startMarker = 'class="xdt5ytf x2lwn1j';
  const startIndex = html.indexOf(startMarker);
  
  if (startIndex === -1) {
    throw new Error('Could not find conversation content');
  }

  // Find the start of the div
  let divStart = startIndex;
  while (divStart >= 0 && html[divStart] !== '<') {
    divStart--;
  }

  // Find the matching closing div by counting opening/closing tags
  let depth = 1;
  let divEnd = startIndex;
  
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

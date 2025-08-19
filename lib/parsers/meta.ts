import type { Conversation } from '@/types/conversation';

/**
 * Extracts a Meta share page into a structured Conversation.
 */
export async function parseMeta(html: string): Promise<Conversation> {
  // Debug log
  console.log('Received HTML:', html.substring(0, 500));
  // Find a div that contains both target classes
  const targetClasses = ['xdt5ytf', 'x2lwn1j'];
  let currentIndex = html.indexOf('class="');
  let startIndex = -1;
  
  // Keep searching for class attributes until we find one with both target classes
  while (currentIndex !== -1 && startIndex === -1) {
    const classEnd = html.indexOf('"', currentIndex + 7);
    if (classEnd !== -1) {
      const classNames = html.slice(currentIndex + 7, classEnd).split(' ');
      if (targetClasses.every(tc => classNames.includes(tc))) {
        startIndex = currentIndex;
      }
    }
    currentIndex = html.indexOf('class="', currentIndex + 1);
  }
  
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

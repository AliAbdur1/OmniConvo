'use strict';
var isRequesting = false;
var model = 'ChatGPT';

chrome.runtime.onMessage.addListener(function (request, _, sendResponse) {
  if (request.action === 'scrape') {
    scrape();
  }
  if (request.action === 'model') {
    model = request.model;
  }
  sendResponse({ success: true });
  return true;
});

async function scrape() {
  // Find all message content divs
  const messageDivs = document.querySelectorAll('div.html-div.xdj266r');
  console.log('Found message divs:', messageDivs.length);
  if (!messageDivs.length || isRequesting) {
    console.log('No messages found or already requesting');
    return;
  }

  // Get the conversation container by walking up the parent chain
  let conversationDiv = messageDivs[0].parentElement;
  while (conversationDiv && !conversationDiv.classList.contains('xb57i2i')) {
    conversationDiv = conversationDiv.parentElement;
  }
  if (!conversationDiv) {
    console.log('Could not find conversation container');
    return;
  }

  // Clone the div to preserve original DOM
  const clonedDiv = conversationDiv.cloneNode(true);
  
  // Remove UI controls and unnecessary elements
  const elementsToRemove = clonedDiv.querySelectorAll('div.x78zum5.xmixu3c, div[role="button"]');
  elementsToRemove.forEach(el => el.remove());

  // Clean up the conversation content
  const messages = [];
  
  // Extract user messages
  const userMessages = clonedDiv.querySelectorAll('span.x1lliihq.x1plvlek');
  userMessages.forEach(msg => {
    const content = msg.innerHTML;
    messages.push({ type: 'user', content });
  });

  // Extract AI messages
  const aiMessages = clonedDiv.querySelectorAll('div.html-div.xdj266r:not(:has(span.x1lliihq.x1plvlek))');
  aiMessages.forEach(msg => {
    const content = msg.innerHTML;
    messages.push({ type: 'ai', content });
  });

  // Sort messages by their DOM order
  messages.sort((a, b) => {
    const aEl = clonedDiv.querySelector(`*:contains("${a.content}")`);
    const bEl = clonedDiv.querySelector(`*:contains("${b.content}")`);
    return aEl.compareDocumentPosition(bEl) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
  });

  const htmlDoc = clonedDiv.outerHTML;
  console.log('HTML to send:', htmlDoc.substring(0, 200));
  isRequesting = true;

  const apiUrl = `${window.EXTENSION_CONFIG.baseUrl}/api/conversation`;
  const body = new FormData();

  // raw HTML
  body.append('htmlDoc', new Blob([htmlDoc], { type: 'text/plain; charset=utf-8' }));
  // model
  body.append('model', model);

  try {
    const res = await fetch(apiUrl, { method: 'POST', body });
    console.log('res =>', res, apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { url } = await res.json();
    window.open(url, '_blank'); // view the saved conversation
  } catch (err) {
    alert(`Error saving conversation: ${err.message}`);
  } finally {
    isRequesting = false;
  }
}

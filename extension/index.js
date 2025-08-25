'use strict';
var isRequesting = false;
var model = 'Meta';

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
  console.log('Found conversation container:', conversationDiv?.className);
  if (!conversationDiv) {
    console.log('Could not find conversation container');
    return;
  }
  console.log('Found conversation container:', conversationDiv.className);

  // Clone the div to remove UI elements
  const clonedDiv = conversationDiv.cloneNode(true);
  
  // Remove UI controls container
  const controlsToRemove = clonedDiv.querySelectorAll('div.x78zum5.xmixu3c');
  controlsToRemove.forEach(controls => controls.remove());

  // Add indicators for both user inputs and AI responses
  function addIndicator(element, text, isUser) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '0.5rem';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.marginBottom = '1.5rem';

    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';
    messageDiv.style.background = isUser ? '#f0f7ff' : '#f0fff4';
    messageDiv.style.border = isUser ? '1px solid #cce3ff' : '1px solid #c6f6d5';
    messageDiv.style.borderRadius = isUser ? '12px 12px 12px 0' : '12px 12px 0 12px';
    messageDiv.style.padding = '1rem';
    messageDiv.style.maxWidth = '85%';
    messageDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';

    const indicator = document.createElement('span');
    indicator.className = isUser ? 'message-indicator user-indicator' : 'message-indicator ai-indicator';
    indicator.textContent = text;
    indicator.style.fontSize = '0.875rem';
    indicator.style.fontWeight = '500';
    indicator.style.padding = '0.25rem 0.75rem';
    indicator.style.borderRadius = '9999px';
    indicator.style.marginBottom = '0.5rem';
    indicator.style.display = 'inline-block';
    
    messageDiv.appendChild(indicator);
    messageDiv.appendChild(element);
    wrapper.appendChild(messageDiv);
  }

  // Add user input indicators
  const userInputs = clonedDiv.querySelectorAll('span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x');
  userInputs.forEach(input => {
    addIndicator(input, '👤 User', true);
  });

  // Add AI response indicators
  const aiResponses = clonedDiv.querySelectorAll('div.xb57i2i:not(:has(span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6))');
  aiResponses.forEach(response => {
    addIndicator(response, '🤖 AI', false);
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

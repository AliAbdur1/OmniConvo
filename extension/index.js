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

  // Clone the div to remove UI elements
  const clonedDiv = conversationDiv.cloneNode(true);

  // Remove UI controls container
  const controlsToRemove = clonedDiv.querySelectorAll('div.x78zum5.xmixu3c');
  controlsToRemove.forEach(controls => controls.remove());

  // Add indicators for both user inputs and AI responses
  function addIndicator(element, text, isUser) {
    const wrapper = document.createElement('div');
    wrapper.className = 'message-wrapper';

    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'user-message' : 'ai-message';

    const indicator = document.createElement('div');
    indicator.className = isUser ? 'indicator user-indicator' : 'indicator ai-indicator';
    indicator.textContent = text;

    const contentClone = element.cloneNode(true);

    messageDiv.appendChild(indicator);
    messageDiv.appendChild(contentClone);
    wrapper.appendChild(messageDiv);

    // Replace original element with wrapper
    element.replaceWith(wrapper);
  }

  // Add user input indicators
  const userInputs = clonedDiv.querySelectorAll(
    'span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x'
  );
  userInputs.forEach(input => {
    // console.log("User input:", i, input.textContent.slice(0,50)); // looking for duplicates
    addIndicator(input, '👤 User', true);
  });

  // Add AI response indicators (manual filter, avoids :has())
  const aiResponses = [
    ...clonedDiv.querySelectorAll('div.xb57i2i, div.html-div.xdj266r, ol.x43c9pm, ul.x43c9pm li.xe0n8xf')
  ].filter(div => {
    // Exclude elements inside user messages
    if (div.closest('span.x1lliihq.x1plvlek')) return false;
    
    // Include section headers
    if (div.querySelector('[id^="section-"]')) return true;
    
    // Include list items and regular content
    const isList = div.classList.contains('xe0n8xf') || div.classList.contains('x43c9pm');
    const isHeader = div.querySelector('b');
    const isRegularContent = div.classList.contains('xdj266r') || 
                           div.classList.contains('xb57i2i');
    
    // Group related list items under their headers
    if (isList && isHeader) {
      const subItems = div.nextElementSibling?.querySelectorAll('li.xe0n8xf');
      if (subItems) {
        subItems.forEach(item => item.dataset.parentHeader = div.textContent);
      }
    }
    
    return isRegularContent || isList;
  });

  aiResponses.forEach(response => {
    // Get section header if present
    const sectionHeader = response.querySelector('[id^="section-"]');
    const parentHeader = response.dataset.parentHeader;
    const label = sectionHeader ? `🤖 AI (${sectionHeader.textContent})` : 
                 parentHeader ? `🤖 AI (${parentHeader})` :
                 '🤖 AI';
    addIndicator(response, label, false);
  });

  // Inject global CSS into cloned document
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    body {
      font-family: system-ui, sans-serif;
      background: #f9fafb;
      padding: 1rem;
      line-height: 1.5;
    }
    .message-wrapper {
      display: flex;
      gap: 0.5rem;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }
    .user-message, .ai-message {
      padding: 1rem;
      max-width: 75%;
      border-radius: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.08);
    }
    .user-message {
      background: #f0f7ff;
      border: 1px solid #cce3ff;
      border-radius: 12px 12px 12px 0;
    }
    .ai-message {
      background: #f0fff4;
      border: 1px solid #c6f6d5;
      border-radius: 12px 12px 0 12px;
    }
    .indicator {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      margin-bottom: 0.5rem;
      display: inline-block;
    }
    .user-indicator {
      background: #dceeff;
      color: #004085;
    }
    .ai-indicator {
      background: #d7fbe8;
      color: #155724;
    }
  `;
  clonedDiv.prepend(styleEl);

  // Build final HTML string
  const htmlDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Saved Conversation</title>
      </head>
      <body>
        ${clonedDiv.outerHTML}
      </body>
    </html>
  `;

  console.log('HTML to send:', htmlDoc.substring(0, 200));
  isRequesting = true;

  const apiUrl = `${window.EXTENSION_CONFIG.baseUrl}/api/conversation`;
  const body = new FormData();

  // raw HTML
  body.append('htmlDoc', new Blob([htmlDoc], { type: 'text/html; charset=utf-8' }));
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

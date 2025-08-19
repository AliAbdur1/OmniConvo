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
  function addIndicator(element, text, color, bgColor) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '8px';
    
    const indicator = document.createElement('span');
    indicator.textContent = text;
    indicator.style.color = color;
    indicator.style.fontSize = '0.9em';
    indicator.style.fontWeight = 'bold';
    indicator.style.backgroundColor = bgColor;
    indicator.style.padding = '2px 8px';
    indicator.style.borderRadius = '4px';
    
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);
    wrapper.appendChild(indicator);
  }

  // Add user input indicators
  const userInputs = clonedDiv.querySelectorAll('span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.xyejjpt.x15dsfln.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x');
  userInputs.forEach(input => {
    addIndicator(input, '👤 User', '#0066cc', '#e6f3ff');
  });

  // Add AI response indicators
  const aiResponses = clonedDiv.querySelectorAll('div.xb57i2i:not(:has(span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6))');
  aiResponses.forEach(response => {
    addIndicator(response, '🤖 AI', '#2d862d', '#e6ffe6');
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

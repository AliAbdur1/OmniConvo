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

  const htmlDoc = conversationDiv.outerHTML;
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

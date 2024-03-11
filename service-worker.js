chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install' || reason === 'update') {
    chrome.windows.create({
      url: chrome.runtime.getURL('assets/noti.html'),
      type: 'popup',
      width: 500,
      height: 500,
    });
  }
});

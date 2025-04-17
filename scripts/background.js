// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
    // 在当前标签页打开页面
    chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL('index.html')
    });
});

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getBookmarks') {
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            sendResponse({ bookmarks: bookmarkTreeNodes });
        });
        return true; // 保持消息通道开放
    }
});
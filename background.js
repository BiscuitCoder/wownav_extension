// 监听扩展图标点击事件
chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: 'index.html'
    });
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);

    if (request.action === 'generateTemplate') {
        // 调用 DeepSeek API
        fetch('https://api.deepseek.com', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${request.apiKey}`
                },
                body: JSON.stringify(request.data)
            })
            .then(response => response.json())
            .then(data => {
                sendResponse({ success: true, data: data });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        // 返回 true 表示会异步发送响应
        return true;
    } else if (request.action === 'getBookmarks') {
        // 获取书签数据
        chrome.bookmarks.getTree((bookmarkTreeNodes) => {
            sendResponse({ bookmarks: bookmarkTreeNodes });
        });
        return true;
    }
});
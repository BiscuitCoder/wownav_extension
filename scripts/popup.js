// 当popup页面加载完成时执行
document.addEventListener('DOMContentLoaded', () => {
    // 初始化生成按钮为禁用状态
    const generateButton = document.getElementById('generateButton');
    generateButton.disabled = true;
    generateButton.title = '请先选择书签';

    // 向后台脚本请求书签数据
    chrome.runtime.sendMessage({ action: 'getBookmarks' }, (response) => {
        if (response && response.bookmarks) {
            const flattenedBookmarks = flattenBookmarks(response.bookmarks);
            displayBookmarks(flattenedBookmarks);
            setupExportButton();
            // 启用生成按钮
            generateButton.disabled = false;
            generateButton.title = '点击生成在线导航';
        }
    });

    const themeColor = document.getElementById('themeColor');
    const themeColorText = document.getElementById('themeColorText');

    // 同步颜色选择器和文本输入框的值
    themeColor.addEventListener('input', function() {
        themeColorText.value = this.value;
    });

    themeColorText.addEventListener('input', function() {
        if (this.checkValidity()) {
            themeColor.value = this.value;
        }
    });

    // 初始化颜色值
    themeColorText.value = themeColor.value;

    // 生成按钮点击事件
    generateButton.addEventListener('click', async() => {
        await handleGenerateClick(false);
    });

    // 下载HTML按钮点击事件
    const downloadHtmlButton = document.getElementById('downloadHtmlButton');
    downloadHtmlButton.addEventListener('click', async() => {
        await handleGenerateClick(true);
    });

    async function handleGenerateClick(isDownload) {
        // 重置所有错误状态
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('has-error');
        });

        // 获取表单数据
        const siteTitle = document.getElementById('siteTitle').value.trim();
        const siteDescription = document.getElementById('siteDescription').value.trim();
        const keywords = document.getElementById('keywords').value.trim();
        const themeColor = document.getElementById('themeColor').value;
        const customCode = document.getElementById('customCode').value.trim();

        // 验证表单
        let hasError = false;
        if (!siteTitle) {
            document.getElementById('siteTitle').closest('.form-group').classList.add('has-error');
            hasError = true;
        }
        if (!siteDescription) {
            document.getElementById('siteDescription').closest('.form-group').classList.add('has-error');
            hasError = true;
        }
        if (!keywords) {
            document.getElementById('keywords').closest('.form-group').classList.add('has-error');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        // 获取选中的书签
        const selectedBookmarks = getSelectedBookmarks();
        if (Object.keys(selectedBookmarks).length === 0) {
            alert('请至少选择一个书签');
            return;
        }

        try {
            // 显示加载状态
            const originalText = isDownload ? downloadHtmlButton.textContent : generateButton.textContent;
            const button = isDownload ? downloadHtmlButton : generateButton;
            button.textContent = '正在生成...';
            button.disabled = true;
            button.classList.add('loading');

            // 隐藏之前的链接
            const generatedLink = document.getElementById('generatedLink');
            generatedLink.style.display = 'none';

            // 如果用户输入了自定义代码，添加加载提示
            let loadingTip = null;
            let jokeInterval = null;
            if (customCode.trim()) {
                loadingTip = createLoadingTip();
                generatedLink.parentNode.insertBefore(loadingTip, generatedLink);
                showRandomJoke(loadingTip);

                // 每10秒更换一次笑话
                jokeInterval = setInterval(() => {
                    showRandomJoke(loadingTip);
                }, 10000);
            }

            // 转换为SiteConfig格式
            const siteConfig = convertToSiteConfig(selectedBookmarks, {
                title: siteTitle,
                description: siteDescription,
                keywords: keywords,
                themeColor: themeColor,
                customCode: customCode
            });

            // 调用beautify接口
            const beautifyResult = await callBeautifyApi(customCode, siteConfig, !isDownload);

            if (isDownload) {
                // 创建下载链接
                const blob = new Blob([beautifyResult.data], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${siteTitle}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                // 显示生成的链接
                const linkElement = generatedLink.querySelector('a');
                linkElement.href = beautifyResult.data;
                linkElement.textContent = beautifyResult.data;
                generatedLink.style.display = 'block';
            }

            // 恢复按钮状态
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('loading');

            // 清除加载提示和定时器
            if (loadingTip) {
                loadingTip.remove();
            }
            if (jokeInterval) {
                clearInterval(jokeInterval);
            }
        } catch (error) {
            console.error('生成 HTML 失败:', error);
            alert('生成 HTML 失败，请稍后重试');

            // 恢复按钮状态
            const button = isDownload ? downloadHtmlButton : generateButton;
            button.textContent = originalText;
            button.disabled = false;
            button.classList.remove('loading');

            // 清除加载提示和定时器
            if (loadingTip) {
                loadingTip.remove();
            }
            if (jokeInterval) {
                clearInterval(jokeInterval);
            }
        }
    }
});

// 扁平化书签数据，将所有书签收集到一个数组中
function flattenBookmarks(bookmarkNodes) {
    let allBookmarks = [];

    function traverse(node, path = '') {
        if (node.children) {
            // 这是一个文件夹
            const folderName = node.title || '未命名文件夹';
            const currentPath = path ? `${path} > ${folderName}` : folderName;

            // 递归处理子节点
            node.children.forEach(child => traverse(child, currentPath));
        } else if (node.url) {
            // 这是一个书签
            allBookmarks.push({
                type: 'bookmark',
                title: node.title,
                url: node.url,
                path: path,
                folderName: path.split(' > ').pop() || '未分类' // 获取最后一级分类名称
            });
        }
    }

    bookmarkNodes.forEach(node => traverse(node));
    return allBookmarks;
}

// 显示书签数据
function displayBookmarks(bookmarks) {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.innerHTML = ''; // 清空现有内容

    // 按路径分组书签
    const groupedBookmarks = {};
    bookmarks.forEach(bookmark => {
        const folderName = bookmark.folderName;
        if (!groupedBookmarks[folderName]) {
            groupedBookmarks[folderName] = {
                title: folderName,
                bookmarks: []
            };
        }
        groupedBookmarks[folderName].bookmarks.push(bookmark);
    });

    // 过滤掉没有书签的分类，并显示分组后的书签
    Object.entries(groupedBookmarks)
        .filter(([_, group]) => group.bookmarks.length > 0) // 只保留有书签的分类
        .forEach(([folderName, group]) => {
            const folderDiv = document.createElement('div');
            folderDiv.className = 'bookmark-folder';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'folder-header';

            // 添加文件夹复选框
            const folderCheckbox = document.createElement('div');
            folderCheckbox.className = 'checkbox-wrapper';
            folderCheckbox.innerHTML = `<input type="checkbox" checked data-folder="${folderName}">`;

            // 添加文件夹标题
            const folderTitle = document.createElement('div');
            folderTitle.className = 'folder-title';
            folderTitle.innerHTML = `
                <span class="folder-name">${group.title} (${group.bookmarks.length})</span>
                <span class="toggle-icon">▶</span>
            `;

            headerDiv.appendChild(folderCheckbox);
            headerDiv.appendChild(folderTitle);

            const contentDiv = document.createElement('div');
            contentDiv.className = 'folder-content';

            // 添加展开/收起功能
            folderTitle.addEventListener('click', () => {
                contentDiv.classList.toggle('expanded');
                folderTitle.querySelector('.toggle-icon').classList.toggle('expanded');
            });

            // 添加书签到内容区域
            group.bookmarks.forEach(bookmark => {
                const bookmarkDiv = document.createElement('div');
                bookmarkDiv.className = 'bookmark-item';

                // 添加书签复选框
                const bookmarkCheckbox = document.createElement('div');
                bookmarkCheckbox.className = 'checkbox-wrapper';
                bookmarkCheckbox.innerHTML = `<input type="checkbox" checked data-url="${bookmark.url}">`;

                const bookmarkContent = document.createElement('div');
                bookmarkContent.className = 'bookmark-content';
                bookmarkContent.innerHTML = `
                    <div class="bookmark-title">${bookmark.title}</div>
                    <div class="bookmark-url">${bookmark.url}</div>
                `;

                bookmarkDiv.appendChild(bookmarkCheckbox);
                bookmarkDiv.appendChild(bookmarkContent);
                contentDiv.appendChild(bookmarkDiv);
            });

            folderDiv.appendChild(headerDiv);
            folderDiv.appendChild(contentDiv);
            bookmarksList.appendChild(folderDiv);
        });
}

// 设置导出按钮功能
function setupExportButton() {
    const exportButton = document.getElementById('exportButton');
    exportButton.addEventListener('click', () => {
        const selectedData = getSelectedBookmarks();
        const jsonString = JSON.stringify(selectedData, null, 2);

        // 创建下载链接
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookmarks.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// 获取选中的书签数据
function getSelectedBookmarks() {
    const result = {};

    // 获取所有文件夹复选框
    const folderCheckboxes = document.querySelectorAll('input[type="checkbox"][data-folder]');
    folderCheckboxes.forEach(checkbox => {
        const folderName = checkbox.dataset.folder;
        if (checkbox.checked) {
            result[folderName] = [];

            // 获取该文件夹下的所有书签复选框
            const bookmarkCheckboxes = checkbox.closest('.bookmark-folder')
                .querySelectorAll('input[type="checkbox"][data-url]');

            bookmarkCheckboxes.forEach(bookmarkCheckbox => {
                if (bookmarkCheckbox.checked) {
                    const url = bookmarkCheckbox.dataset.url;
                    const bookmarkDiv = bookmarkCheckbox.closest('.bookmark-item');
                    const title = bookmarkDiv.querySelector('.bookmark-title').textContent;

                    result[folderName].push({
                        title: title,
                        url: url
                    });
                }
            });
        }
    });

    return result;
}

// 生成书签HTML
function generateBookmarksHtml(bookmarks) {
    return Object.entries(bookmarks).map(([folderName, bookmarks]) => `
        <div class="bookmark-section">
            <h2 class="section-title">${folderName}</h2>
            <div class="bookmark-grid">
                ${bookmarks.map(bookmark => `
                    <a href="${bookmark.url}" class="bookmark-item" target="_blank">
                        <div class="bookmark-title">${bookmark.title}</div>
                    </a>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 将中文转换为拼音
function convertToPinyin(text) {
    try {
        return pinyinPro.pinyin(text, { toneType: 'none' }).toLowerCase().trim().replace(/\s+/g, '');
    } catch (error) {
        console.error('拼音转换失败:', error);
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
    }
}

// 将书签数据转换为SiteConfig格式
function convertToSiteConfig(bookmarks, seoInfo) {
    const navs = Object.entries(bookmarks).map(([category, items], index) => ({
        category,
        sort: index + 1,
        navs: items.map(item => ({
            name: item.title,
            url: item.url,
            sort: 0
        }))
    }));

    // 获取选中的标签
    const tagSelect = document.getElementById('tagSelect');
    const selectedTag = tagSelect ? tagSelect.value : '';

    return {
        title: seoInfo.title,
        name: convertToPinyin(seoInfo.title), // 将标题转换为拼音
        description: seoInfo.description,
        keywords: seoInfo.keywords,
        icon: "", // 默认值
        themeColor: seoInfo.themeColor, // 使用传入的主题色
        about: "Wownav 是一个开放免费的导航网站生成工具", // 默认值
        contact: "", // 默认值
        logo: "", // 默认值
        author: "书签导航生成器", // 默认值
        authorUrl: "https://github.com/wownav", // 默认值
        password: "123456", // 默认值
        tag: selectedTag, // 添加标签字段
        navs
    };
}

// 生成导航HTML
function generateNavigationHtml(bookmarks, seoInfo) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoInfo.title}</title>
    <meta name="description" content="${seoInfo.description}">
    <meta name="keywords" content="${seoInfo.keywords}">
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 30px;
        }
        
        .bookmark-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .section-title {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .bookmark-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .bookmark-item {
            background: #fff;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            transition: all 0.3s ease;
            text-decoration: none;
            color: #333;
        }
        
        .bookmark-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            border-color: #3498db;
        }
        
        .bookmark-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #2c3e50;
        }
        
        .bookmark-description {
            font-size: 0.9em;
            color: #666;
        }
        
        @media (max-width: 768px) {
            .bookmark-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${seoInfo.title}</h1>
        ${generateBookmarkSections(bookmarks)}
    </div>
</body>
</html>`;
}

// 生成书签分区HTML
function generateBookmarkSections(bookmarks) {
    return Object.entries(bookmarks).map(([folderName, bookmarks]) => `
        <div class="bookmark-section">
            <h2 class="section-title">${folderName}</h2>
            <div class="bookmark-grid">
                ${bookmarks.map(bookmark => `
                    <a href="${bookmark.url}" class="bookmark-item" target="_blank">
                        <div class="bookmark-title">${bookmark.title}</div>
                    </a>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// 添加笑话数组
const jokes = [
    "为什么程序员不喜欢户外活动？因为他们害怕遇到bug。",
    "为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25。",
    "为什么程序员不喜欢写注释？因为他们觉得代码就是最好的注释。",
    "为什么程序员不喜欢写文档？因为他们觉得写代码已经够难了。",
    "为什么程序员总是很累？因为他们一直在处理异步问题。",
    "为什么程序员不喜欢写测试？因为他们觉得写代码已经够难了，还要写测试？"
];

// 添加加载提示元素
function createLoadingTip() {
    const tip = document.createElement('div');
    tip.className = 'loading-tip';
    tip.style.cssText = `
        margin-top: 10px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 4px;
        color: #666;
        font-size: 14px;
        text-align: center;
    `;
    return tip;
}

// 显示随机笑话
function showRandomJoke(container) {
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    container.textContent =  `🤡 ${joke}`;
}
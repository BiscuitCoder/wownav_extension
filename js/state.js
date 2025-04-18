// 在文件开头添加标签数据
const tagData = {
    "科技": 7,
    "其他": 2,
    "制造业": 1,
    "游戏": 1,
    "未分类": 1,
    "教育": 1,
    "社交": 1,
    "非营利": 1,
    "电商": 1
};

// 在初始化标签选择器函数中添加
function initializeTagSelect() {
    const tagSelect = document.getElementById('tagSelect');
    if (!tagSelect) return;

    // 更新标签数量
    Object.entries(tagData).forEach(([tag, count]) => {
        const option = tagSelect.querySelector(`option[value="${tag}"]`);
        if (option) {
            option.textContent = `${tag} (${count})`;
        }
    });

    // 设置默认选中第一个选项
    if (tagSelect.options.length > 0) {
        tagSelect.selectedIndex = 0;
        // 触发 change 事件以更新 siteConfig
        tagSelect.dispatchEvent(new Event('change'));
    }

    // 监听标签选择变化
    tagSelect.addEventListener('change', function() {
        const selectedTag = this.value;
        // 更新siteConfig中的tag字段
        if (typeof siteConfig === 'object') {
            siteConfig.tag = selectedTag;
            console.log('更新后的siteConfig:', siteConfig);
        }
    });
}

// 渲染书签列表
function renderBookmarks(bookmarks) {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.innerHTML = '';

    // 按文件夹分组
    const folders = {};
    bookmarks.forEach(bookmark => {
        const folder = bookmark.parentTitle || '未分类';
        if (!folders[folder]) {
            folders[folder] = [];
        }
        folders[folder].push(bookmark);
    });

    // 渲染每个文件夹
    Object.entries(folders).forEach(([folder, items]) => {
                const folderElement = document.createElement('div');
                folderElement.className = 'bookmark-folder';
                folderElement.innerHTML = `
            <div class="folder-header">
                <div class="checkbox-wrapper">
                    <input type="checkbox" class="folder-checkbox" data-folder="${folder}">
                </div>
                <div class="folder-title">
                    <span class="folder-name">${folder}</span>
                    <span class="toggle-icon">▶</span>
                </div>
            </div>
            <div class="folder-content">
                ${items.map(item => `
                    <div class="bookmark-item">
                        <div class="checkbox-wrapper">
                            <input type="checkbox" class="bookmark-checkbox" id="bookmark-${item.id}">
                        </div>
                        <div class="bookmark-content">
                            <div class="bookmark-title">${item.title}</div>
                            <div class="bookmark-url">${item.url}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        bookmarksList.appendChild(folderElement);
    });

    // 添加文件夹展开/收起功能
    document.querySelectorAll('.folder-title').forEach(title => {
        title.addEventListener('click', function() {
            const content = this.closest('.folder-header').nextElementSibling;
            const icon = this.querySelector('.toggle-icon');
            content.classList.toggle('expanded');
            icon.classList.toggle('expanded');
        });
    });

    // 添加文件夹checkbox事件监听
    document.querySelectorAll('.folder-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const folder = this.closest('.bookmark-folder');
            const bookmarks = folder.querySelectorAll('.bookmark-checkbox');
            bookmarks.forEach(bookmark => {
                bookmark.checked = this.checked;
            });
            updateStats();
        });
    });

    // 添加书签checkbox事件监听
    document.querySelectorAll('.bookmark-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const folder = this.closest('.bookmark-folder');
            const folderCheckbox = folder.querySelector('.folder-checkbox');
            const allBookmarks = folder.querySelectorAll('.bookmark-checkbox');
            const allChecked = Array.from(allBookmarks).every(cb => cb.checked);
            folderCheckbox.checked = allChecked;
            updateStats();
        });
    });

    // 初始化统计
    updateStats();
}

// 更新统计信息
function updateStats() {
    const selectedTagsCountValue = document.getElementById('selectedTagsCountValue');
    const selectedUrlsCountValue = document.getElementById('selectedUrlsCountValue');
    
    if (!selectedTagsCountValue || !selectedUrlsCountValue) {
        console.error('统计元素未找到');
        return;
    }
    
    // 获取所有选中的文件夹checkbox
    const checkedFolders = document.querySelectorAll('.bookmark-folder .folder-header input[type="checkbox"]:checked');

    
    // 只统计被选中文件夹下的网址
    let totalSelectedUrls = 0;
    checkedFolders.forEach(folderCheckbox => {
        const folder = folderCheckbox.closest('.bookmark-folder');
        const checkedBookmarks = folder.querySelectorAll('.bookmark-item input[type="checkbox"]:checked');
        totalSelectedUrls += checkedBookmarks.length;
    });
    
    // 更新显示
    selectedTagsCountValue.textContent = checkedFolders.length;
    selectedUrlsCountValue.textContent = totalSelectedUrls;
}

// 在页面加载完成后延迟1秒执行统计
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateStats, 1000);
});

// 监听所有checkbox的变化
document.addEventListener('change', function(e) {
    if (e.target.matches('input[type="checkbox"]')) {
        updateStats();
    }
});

// 处理分类选择
function handleTagSelect(tag, checked) {
    const bookmarks = document.querySelectorAll(`.bookmark-item[data-tag="${tag}"] input[type="checkbox"]`);
    bookmarks.forEach(checkbox => {
        checkbox.checked = checked;
    });
    updateStats();
}

// 处理网址选择
function handleBookmarkSelect(bookmarkItem, checked) {
    const tag = bookmarkItem.dataset.tag;
    if (tag) {
        // 检查该分类下的所有网址是否都被选中
        const allBookmarksInTag = document.querySelectorAll(`.bookmark-item[data-tag="${tag}"] input[type="checkbox"]`);
        const allChecked = Array.from(allBookmarksInTag).every(checkbox => checkbox.checked);

        // 更新分类选择器的状态
        const tagOption = document.querySelector(`#tagSelect option[value="${tag}"]`);
        if (tagOption) {
            tagOption.selected = allChecked;
        }
    }
    updateStats();
}

// 在复选框变化时更新统计信息
document.addEventListener('change', function(e) {
    if (e.target.matches('.bookmark-item input[type="checkbox"]')) {
        const bookmarkItem = e.target.closest('.bookmark-item');
        handleBookmarkSelect(bookmarkItem, e.target.checked);
    }
});

// 监听分类选择变化
document.getElementById('tagSelect').addEventListener('change', function() {
    const selectedTag = this.value;
    if (selectedTag) {
        handleTagSelect(selectedTag, true);
    }
});

// 初始化页面
function initializePage() {
    // 初始化标签选择器
    initializeTagSelect();

    // 监听复选框变化
    document.addEventListener('change', function(e) {
        if (e.target.matches('.bookmark-item input[type="checkbox"]')) {
            updateStats();
        }
    });
    
    // 初始统计
    updateStats();
}

// 获取书签数据并初始化页面
async function initializeBookmarks() {
    try {
        // 从 Chrome API 获取书签数据
        const bookmarks = await chrome.bookmarks.getTree();
        const flattenedBookmarks = flattenBookmarks(bookmarks[0]);
        
        // 渲染书签列表
        renderBookmarks(flattenedBookmarks);
        
        // 初始化统计
        updateStats();
    } catch (error) {
        console.error('Error initializing bookmarks:', error);
    }
}

// 更新标签数据
function updateTagData(bookmarks) {
    const tagCounts = {};
    
    // 统计每个标签的书签数量
    bookmarks.forEach(bookmark => {
        const tag = bookmark.tag || '未分类';
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    
    // 更新标签选择器的选项
    const tagSelect = document.getElementById('tagSelect');
    if (tagSelect) {
        // 清空现有选项
        tagSelect.innerHTML = '<option value="">请选择分类</option>';
        
        // 添加新的选项
        Object.entries(tagCounts).forEach(([tag, count]) => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = `${tag} (${count})`;
            tagSelect.appendChild(option);
        });
    }
}

// 在DOMContentLoaded事件中初始化页面
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeBookmarks, 1000);
});
// 主题管理函数 - 从storage.js获取设置，与主应用保持一致
function updateThemeFromSettings() {
    if (!window.StorageManager) {
        console.warn('StorageManager not available, using default theme');
        return;
    }
    
    const settings = StorageManager.getSettings();
    const theme = settings.theme || 'system';
    
    // 移除所有主题类
    document.body.classList.remove('light-theme', 'dark-theme', 'dark-mode');
    
    // 根据设置应用主题
    if (theme === 'dark') {
        document.body.classList.add('dark-theme', 'dark-mode');
        document.body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.setAttribute('data-theme', 'light');
    } else if (theme === 'auto' || theme === 'system') {
        // 自动模式：根据时间判断
        const currentHour = new Date().getHours();
        const isDarkMode = currentHour >= 18 || currentHour < 6;
        
        if (isDarkMode) {
            document.body.classList.add('dark-theme', 'dark-mode');
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            document.body.setAttribute('data-theme', 'light');
        }
    }
    
    // 设置HTML元素的data属性，便于CSS选择器使用
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// 监听主题变化
function setupThemeListener() {
    // 监听storage变化
    window.addEventListener('storage', function(e) {
        if (e.key === 'schedule_app_data') {
            updateThemeFromSettings();
        }
    });
    
    // 监听主题变化事件（来自主应用）
    document.addEventListener('themechange', function(e) {
        const theme = e.detail.theme;
        document.body.classList.remove('light-theme', 'dark-theme', 'dark-mode');
        if (theme === 'dark') {
            document.body.classList.add('dark-theme', 'dark-mode');
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.classList.add('light-theme');
            document.body.setAttribute('data-theme', 'light');
        }
        document.documentElement.setAttribute('data-theme', theme);
    });
    
    // 定期检查主题设置（以防其他页面修改了设置）
    setInterval(updateThemeFromSettings, 30000); // 每30秒检查一次
}

// 立即初始化主题（不等待DOMContentLoaded）
updateThemeFromSettings();



// 搜索功能
const searchInput = document.querySelector('.search-input');
const resourceCards = document.querySelectorAll('.resource-card');

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 优化搜索功能
const handleSearch = debounce((searchTerm) => {
    resourceCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-description').textContent.toLowerCase();
        const category = card.getAttribute('data-category').toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
            card.style.display = 'block';
            // 添加动画延迟
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 50);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}, 300);

searchInput.addEventListener('input', (e) => {
    handleSearch(e.target.value.toLowerCase());
});

// 分类筛选
const categoryButtons = document.querySelectorAll('.category-btn');

// 最近使用和收藏功能
const MAX_RECENT_ITEMS = 10;
const MAX_FAVORITES = 50;

// 从本地存储加载数据
let recentItems = JSON.parse(localStorage.getItem('recentItems')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// 更新本地存储
function updateLocalStorage() {
    localStorage.setItem('recentItems', JSON.stringify(recentItems));
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// 添加最近使用记录
function addToRecent(card) {
    const cardData = {
        title: card.querySelector('.card-title').textContent,
        description: card.querySelector('.card-description').textContent,
        category: card.getAttribute('data-category'),
        link: card.querySelector('.card-link').href,
        timestamp: Date.now()
    };

    // 移除已存在的相同项目
    recentItems = recentItems.filter(item => item.link !== cardData.link);
    
    // 添加到开头
    recentItems.unshift(cardData);
    
    // 保持最大数量
    if (recentItems.length > MAX_RECENT_ITEMS) {
        recentItems.pop();
    }
    
    updateLocalStorage();
}

// 为所有资源卡片添加事件监听
document.querySelectorAll('.resource-card').forEach(card => {
    const link = card.querySelector('.card-link');
    
    // 点击链接时添加到最近使用
    link.addEventListener('click', () => {
        addToRecent(card);
    });
});

// 修改分类筛选逻辑
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const category = button.textContent;
        
        resourceCards.forEach(card => {
            if (category === '全部') {
                card.style.display = 'block';
            } else {
                card.style.display = card.getAttribute('data-category') === category ? 'block' : 'none';
            }
            
            if (card.style.display === 'block') {
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                }, 50);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

// 优化卡片动画
function initializeCards() {
    resourceCards.forEach((card, index) => {
        // 设置初始状态
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        
        // 添加动画延迟
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 100);
    });
}

// 页面加载完成后初始化卡片动画
document.addEventListener('DOMContentLoaded', () => {
    initializeCards();
    setupThemeListener(); // 设置主题监听器
});

// 添加页面可见性变化监听
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        initializeCards();
    }
}); 
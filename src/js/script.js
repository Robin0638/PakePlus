// 暗色模式切换
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// 检查本地存储中的主题设置
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
} else if (currentTheme === 'light') {
    document.body.setAttribute('data-theme', 'light');
} else if (prefersDarkScheme.matches) {
    document.body.setAttribute('data-theme', 'dark');
}

// 切换主题
themeToggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

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
});

// 添加页面可见性变化监听
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        initializeCards();
    }
}); 
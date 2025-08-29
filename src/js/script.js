// Theme management function - Get settings from storage.js, keep consistent with main app
function updateThemeFromSettings() {
    if (!window.StorageManager) {
        console.warn('StorageManager not available, using default theme');
        return;
    }
    
    const settings = StorageManager.getSettings();
    const theme = settings.theme || 'system';
    
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme', 'dark-mode');
    
    // Apply theme based on settings
    if (theme === 'dark') {
        document.body.classList.add('dark-theme', 'dark-mode');
        document.body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.setAttribute('data-theme', 'light');
    } else if (theme === 'auto' || theme === 'system') {
        // Auto mode: determine by time
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
    
    // Set data attribute on HTML element for CSS selectors
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Listen for theme changes
function setupThemeListener() {
    // Listen for storage changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'schedule_app_data') {
            updateThemeFromSettings();
        }
    });
    
    // Listen for theme change events (from main app)
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
    
    // Periodically check theme settings (in case other pages modified settings)
    setInterval(updateThemeFromSettings, 30000); // Check every 30 seconds
}

// Initialize theme immediately (without waiting for DOMContentLoaded)
updateThemeFromSettings();



// Search functionality
const searchInput = document.querySelector('.search-input');
const resourceCards = document.querySelectorAll('.resource-card');

// Debounce function
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

// Optimized search functionality
const handleSearch = debounce((searchTerm) => {
    resourceCards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        const description = card.querySelector('.card-description').textContent.toLowerCase();
        const category = card.getAttribute('data-category').toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
            card.style.display = 'block';
            // Add animation delay
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

// Category filtering
const categoryButtons = document.querySelectorAll('.category-btn');

// Recent items and favorites functionality
const MAX_RECENT_ITEMS = 10;
const MAX_FAVORITES = 50;

// Load data from local storage
let recentItems = JSON.parse(localStorage.getItem('recentItems')) || [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Update local storage
function updateLocalStorage() {
    localStorage.setItem('recentItems', JSON.stringify(recentItems));
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

// Add to recent items
function addToRecent(card) {
    const cardData = {
        title: card.querySelector('.card-title').textContent,
        description: card.querySelector('.card-description').textContent,
        category: card.getAttribute('data-category'),
        link: card.querySelector('.card-link').href,
        timestamp: Date.now()
    };

    // Remove existing identical items
    recentItems = recentItems.filter(item => item.link !== cardData.link);
    
    // Add to the beginning
    recentItems.unshift(cardData);
    
    // Maintain maximum count
    if (recentItems.length > MAX_RECENT_ITEMS) {
        recentItems.pop();
    }
    
    updateLocalStorage();
}

// Add event Listeners to all resource cards
document.querySelectorAll('.resource-card').forEach(card => {
    const link = card.querySelector('.card-link');
    
    // Add to recent items when clicking the link
    link.addEventListener('click', () => {
        addToRecent(card);
    });
});

// Modify category filtering logic
categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
        categoryButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const category = button.textContent;
        
        resourceCards.forEach(card => {
            if (category === 'All') {
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

// Optimize card animations
function initializeCards() {
    resourceCards.forEach((card, index) => {
        // Set初始状态
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        
        // 添加动画延迟
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 100);
    });
}

// 页面加载Completed后初始化卡片动画
document.addEventListener('DOMContentLoaded', () => {
    initializeCards();
    setupThemeListener(); // Set主题监听器
});

// 添加页面可见性变化监听
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        initializeCards();
    }
}); 
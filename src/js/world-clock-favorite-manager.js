// 世界时钟收藏管理器
class WorldClockFavoriteManager {
    constructor() {
        this.favorites = new Set();
        this.feedback = null;
        this.init();
    }

    init() {
        this.loadFavorites();
        this.setupEventListeners();
    }

    // 加载收藏状态
    loadFavorites() {
        try {
            const stored = localStorage.getItem('worldClockFavorites');
            if (stored) {
                this.favorites = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('加载世界时钟收藏状态失败:', error);
            this.favorites = new Set();
        }
    }

    // 保存收藏状态
    saveFavorites() {
        try {
            localStorage.setItem('worldClockFavorites', JSON.stringify([...this.favorites]));
        } catch (error) {
            console.error('保存世界时钟收藏状态失败:', error);
        }
    }

    // 创建反馈提示
    createFeedback() {
        // 如果已存在反馈元素，先移除
        if (this.feedback && this.feedback.parentNode) {
            this.feedback.parentNode.removeChild(this.feedback);
        }
        
        this.feedback = document.createElement('div');
        this.feedback.className = 'world-clock-favorite-feedback';
        this.feedback.innerHTML = `
            <i data-lucide="check"></i>
            已添加到收藏
        `;
        document.body.appendChild(this.feedback);
    }

    // 设置事件监听器
    setupEventListeners() {
        // 监听主题变化，重新创建图标
        document.addEventListener('themeChanged', () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        });
    }

    // 切换收藏状态
    toggleFavorite(clockId) {
        const isFavorited = this.favorites.has(clockId);
        
        if (isFavorited) {
            this.favorites.delete(clockId);
            this.showUnfavoriteFeedback();
        } else {
            this.favorites.add(clockId);
            this.showFavoriteFeedback();
        }
        
        this.saveFavorites();
        this.updateCardAppearance(clockId);
        this.sortWorldClocks();
        
        // 重新渲染世界时钟以应用排序
        renderWorldClocks();
        
        console.log('世界时钟收藏状态已切换:', clockId, !isFavorited);
    }

    // 检查是否已收藏
    isFavorited(clockId) {
        return this.favorites.has(clockId);
    }

    // 更新卡片外观
    updateCardAppearance(clockId) {
        const cardElement = document.querySelector(`[data-clock-id="${clockId}"]`);
        const buttonElement = cardElement?.querySelector('.world-clock-favorite-button');
        
        if (cardElement && buttonElement) {
            const isFavorited = this.isFavorited(clockId);
            
            if (isFavorited) {
                cardElement.classList.add('favorited');
                buttonElement.classList.add('favorited');
                buttonElement.innerHTML = `
                    <i data-lucide="star"></i>
                    已收藏
                `;
            } else {
                cardElement.classList.remove('favorited');
                buttonElement.classList.remove('favorited');
                buttonElement.innerHTML = `
                    <i data-lucide="star"></i>
                    收藏
                `;
            }
            
            // 重新创建图标
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }
    }

    // 显示收藏反馈
    showFavoriteFeedback() {
        // 创建新的反馈元素
        this.createFeedback();
        
        this.feedback.innerHTML = `
            <i data-lucide="check"></i>
            已添加到收藏
        `;
        this.feedback.classList.remove('unfavorited');
        this.feedback.classList.add('show');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 2秒后自动隐藏
        setTimeout(() => {
            this.hideFeedback();
        }, 2000);
    }

    // 显示取消收藏反馈
    showUnfavoriteFeedback() {
        // 创建新的反馈元素
        this.createFeedback();
        
        this.feedback.innerHTML = `
            <i data-lucide="x"></i>
            已取消收藏
        `;
        this.feedback.classList.add('unfavorited');
        this.feedback.classList.add('show');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 2秒后自动隐藏
        setTimeout(() => {
            this.hideFeedback();
        }, 2000);
    }

    // 隐藏反馈
    hideFeedback() {
        this.feedback.classList.add('hide');
        this.feedback.classList.remove('show');
        
        // 动画完成后移除元素
        setTimeout(() => {
            if (this.feedback && this.feedback.parentNode) {
                this.feedback.parentNode.removeChild(this.feedback);
            }
        }, 300); // 与CSS动画时长一致
    }

    // 排序世界时钟（收藏的优先显示）
    sortWorldClocks() {
        // 对worldClocks数组进行排序
        worldClocks.sort((a, b) => {
            const aFavorited = this.isFavorited(a.id);
            const bFavorited = this.isFavorited(b.id);
            
            if (aFavorited && !bFavorited) {
                return -1; // a排在前面
            } else if (!aFavorited && bFavorited) {
                return 1; // b排在前面
            } else {
                return 0; // 保持原有顺序
            }
        });
    }

    // 添加收藏按钮到世界时钟卡片
    addFavoriteButtonToCard(cardElement, clockId) {
        const favoriteButton = document.createElement('button');
        favoriteButton.className = 'world-clock-favorite-button';
        favoriteButton.title = '收藏世界时钟';
        
        const isFavorited = this.isFavorited(clockId);
        if (isFavorited) {
            favoriteButton.classList.add('favorited');
            favoriteButton.innerHTML = `
                <i data-lucide="star"></i>
                已收藏
            `;
            // 立即应用卡片突出样式
            cardElement.classList.add('favorited');
        } else {
            favoriteButton.innerHTML = `
                <i data-lucide="star"></i>
                收藏
            `;
        }
        
        favoriteButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFavorite(clockId);
        });
        
        cardElement.appendChild(favoriteButton);
        
        // 更新卡片外观
        this.updateCardAppearance(clockId);
    }

    // 初始化所有卡片的收藏状态
    initializeAllCards() {
        worldClocks.forEach(clock => {
            const cardElement = document.querySelector(`[data-clock-id="${clock.id}"]`);
            if (cardElement) {
                if (!cardElement.querySelector('.world-clock-favorite-button')) {
                    this.addFavoriteButtonToCard(cardElement, clock.id);
                } else {
                    // 如果按钮已存在，只更新卡片外观
                    this.updateCardAppearance(clock.id);
                }
            }
        });
    }
}

// 全局实例
let worldClockFavoriteManager = null;

// 初始化世界时钟收藏功能
function initializeWorldClockFavoriteFeature() {
    if (!worldClockFavoriteManager) {
        worldClockFavoriteManager = new WorldClockFavoriteManager();
    }
    
    // 重写renderWorldClocks函数以添加收藏按钮和排序
    const originalRenderWorldClocks = window.renderWorldClocks;
    window.renderWorldClocks = function() {
        // 先排序世界时钟
        if (worldClockFavoriteManager) {
            worldClockFavoriteManager.sortWorldClocks();
        }
        
        // 调用原始函数
        originalRenderWorldClocks();
        
        // 初始化所有卡片的收藏状态
        if (worldClockFavoriteManager) {
            worldClockFavoriteManager.initializeAllCards();
        }
    };
    
    // 确保在页面加载完成后立即应用收藏状态
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (worldClockFavoriteManager) {
                    worldClockFavoriteManager.initializeAllCards();
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (worldClockFavoriteManager) {
                worldClockFavoriteManager.initializeAllCards();
            }
        }, 100);
    }
    
    console.log('世界时钟收藏功能已初始化');
}

// 全局收藏切换函数（供HTML调用）
window.toggleWorldClockFavorite = function(clockId) {
    if (worldClockFavoriteManager) {
        worldClockFavoriteManager.toggleFavorite(clockId);
    }
}; 
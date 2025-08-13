// 秒表收藏管理器
class StopwatchFavoriteManager {
    constructor() {
        this.favorites = new Set();
        this.feedback = null;
        this.loadFavorites();
    }

    // 从localStorage加载收藏数据
    loadFavorites() {
        try {
            const stored = localStorage.getItem('stopwatchFavorites');
            if (stored) {
                this.favorites = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('加载秒表收藏数据失败:', error);
            this.favorites = new Set();
        }
    }

    // 保存收藏数据到localStorage
    saveFavorites() {
        try {
            localStorage.setItem('stopwatchFavorites', JSON.stringify([...this.favorites]));
        } catch (error) {
            console.error('保存秒表收藏数据失败:', error);
        }
    }

    // 切换收藏状态
    toggleFavorite(stopwatchId) {
        if (this.favorites.has(stopwatchId)) {
            this.favorites.delete(stopwatchId);
            this.showUnfavoriteFeedback();
        } else {
            this.favorites.add(stopwatchId);
            this.showFavoriteFeedback();
        }
        
        this.saveFavorites();
        
        // 只更新当前卡片的状态，不重新渲染整个列表
        const card = document.querySelector(`[data-stopwatch-id="${stopwatchId}"]`);
        if (card) {
            this.updateCardAppearance(card, stopwatchId);
            
            // 更新收藏按钮状态
            const favoriteButton = card.querySelector('.stopwatch-favorite-button');
            if (favoriteButton) {
                favoriteButton.classList.remove('favorited');
                if (this.isFavorited(stopwatchId)) {
                    favoriteButton.classList.add('favorited');
                }
            }
        }
        
        // 只在没有搜索和过滤时进行排序和重新渲染
        if (!stopwatchSearchQuery && stopwatchFilterType === 'all') {
            this.sortStopwatches();
            renderStopwatches();
        }
    }

    // 检查是否已收藏
    isFavorited(stopwatchId) {
        return this.favorites.has(stopwatchId);
    }

    // 更新卡片外观
    updateCardAppearance(card, stopwatchId) {
        // 先清除所有收藏相关的类
        card.classList.remove('favorited');
        
        // 根据收藏状态添加类
        if (this.isFavorited(stopwatchId)) {
            card.classList.add('favorited');
        }
    }

    // 显示收藏成功反馈
    showFavoriteFeedback() {
        this.createFeedback();
        this.feedback.classList.add('show');
        this.feedback.classList.remove('unfavorited');
        
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
        this.createFeedback();
        this.feedback.classList.add('show', 'unfavorited');
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        // 2秒后自动隐藏
        setTimeout(() => {
            this.hideFeedback();
        }, 2000);
    }

    // 创建反馈提示
    createFeedback() {
        // 如果已存在反馈元素，先移除
        if (this.feedback && this.feedback.parentNode) {
            this.feedback.parentNode.removeChild(this.feedback);
        }
        
        this.feedback = document.createElement('div');
        this.feedback.className = 'stopwatch-favorite-feedback';
        this.feedback.innerHTML = `
            <i data-lucide="star"></i>
            秒表已收藏
        `;
        document.body.appendChild(this.feedback);
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

    // 排序秒表（收藏的在前）
    sortStopwatches() {
        if (typeof stopwatches !== 'undefined') {
            stopwatches.sort((a, b) => {
                const aFavorited = this.isFavorited(a.id);
                const bFavorited = this.isFavorited(b.id);
                
                if (aFavorited && !bFavorited) return -1;
                if (!aFavorited && bFavorited) return 1;
                return 0;
            });
        }
    }

    // 为卡片添加收藏按钮
    addFavoriteButtonToCard(card, stopwatchId) {
        // 检查是否已存在收藏按钮
        let favoriteButton = card.querySelector('.stopwatch-favorite-button');
        
        if (!favoriteButton) {
            favoriteButton = document.createElement('button');
            favoriteButton.className = 'stopwatch-favorite-button';
            favoriteButton.innerHTML = `
                <i data-lucide="star"></i>
                收藏
            `;
            favoriteButton.onclick = (e) => {
                e.stopPropagation();
                this.toggleFavorite(stopwatchId);
            };
            card.appendChild(favoriteButton);
        }
        
        // 强制更新按钮状态（确保状态正确）
        favoriteButton.classList.remove('favorited');
        if (this.isFavorited(stopwatchId)) {
            favoriteButton.classList.add('favorited');
        }
        
        // 强制更新卡片外观（确保状态正确）
        card.classList.remove('favorited');
        this.updateCardAppearance(card, stopwatchId);
        
        // 重新创建图标
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // 初始化所有卡片
    initializeAllCards() {
        const cards = document.querySelectorAll('.card[data-stopwatch-id]');
        cards.forEach(card => {
            const stopwatchId = parseInt(card.getAttribute('data-stopwatch-id'));
            if (stopwatchId) {
                this.addFavoriteButtonToCard(card, stopwatchId);
                // 确保卡片外观正确应用收藏状态
                this.updateCardAppearance(card, stopwatchId);
            }
        });
    }
}

// 全局实例
let stopwatchFavoriteManager = null;

// 初始化秒表收藏功能
function initializeStopwatchFavoriteFeature() {
    if (!stopwatchFavoriteManager) {
        stopwatchFavoriteManager = new StopwatchFavoriteManager();
    }
    
    // 重写renderStopwatches函数以支持收藏排序
    const originalRenderStopwatches = window.renderStopwatches;
    window.renderStopwatches = function() {
        // 先排序收藏的秒表（仅在显示全部时）
        if (!stopwatchSearchQuery && stopwatchFilterType === 'all') {
            stopwatchFavoriteManager.sortStopwatches();
        }
        
        // 调用原始渲染函数
        originalRenderStopwatches();
        
        // 初始化所有卡片的收藏按钮和外观
        stopwatchFavoriteManager.initializeAllCards();
    };
    
    // 确保在页面加载完成后立即应用收藏状态
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (stopwatchFavoriteManager) {
                    stopwatchFavoriteManager.initializeAllCards();
                }
            }, 100);
        });
    } else {
        setTimeout(() => {
            if (stopwatchFavoriteManager) {
                stopwatchFavoriteManager.initializeAllCards();
            }
        }, 100);
    }
    
    console.log('秒表收藏功能已初始化');
} 
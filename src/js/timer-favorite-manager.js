// 计时器收藏管理器
class TimerFavoriteManager {
    constructor() {
        this.favorites = new Set();
        this.feedback = null;
        this.loadFavorites();
    }

    // 从localStorage加载收藏数据
    loadFavorites() {
        try {
            const stored = localStorage.getItem('timerFavorites');
            if (stored) {
                this.favorites = new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('加载计时器收藏数据失败:', error);
            this.favorites = new Set();
        }
    }

    // 保存收藏数据到localStorage
    saveFavorites() {
        try {
            localStorage.setItem('timerFavorites', JSON.stringify([...this.favorites]));
        } catch (error) {
            console.error('保存计时器收藏数据失败:', error);
        }
    }

    // 切换收藏状态
    toggleFavorite(timerId) {
        console.log(`切换计时器 ${timerId} 的收藏状态`);
        
        if (this.favorites.has(timerId)) {
            this.favorites.delete(timerId);
            this.showUnfavoriteFeedback();
            console.log(`已取消收藏计时器 ${timerId}`);
        } else {
            this.favorites.add(timerId);
            this.showFavoriteFeedback();
            console.log(`已收藏计时器 ${timerId}`);
        }
        
        this.saveFavorites();
        
        // 只更新当前卡片的状态，不重新渲染整个列表
        const card = document.querySelector(`[data-timer-id="${timerId}"]`);
        if (card) {
            this.updateCardAppearance(card, timerId);
            
            // 更新收藏按钮状态
            const favoriteButton = card.querySelector('.timer-favorite-button');
            if (favoriteButton) {
                favoriteButton.classList.remove('favorited');
                if (this.isFavorited(timerId)) {
                    favoriteButton.classList.add('favorited');
                }
                
                // 更新按钮文本
                const span = favoriteButton.querySelector('span');
                if (span) {
                    span.textContent = this.isFavorited(timerId) ? '已收藏' : '收藏';
                }
            }
        }
        
        // 只在没有搜索和过滤时进行排序和重新渲染
        if (!timerSearchQuery && timerFilterType === 'all') {
            renderTimers();
        }
    }

    // 检查是否已收藏
    isFavorited(timerId) {
        return this.favorites.has(timerId);
    }

    // 更新卡片外观
    updateCardAppearance(card, timerId) {
        // 先清除所有收藏相关的类
        card.classList.remove('favorited');
        
        // 根据收藏状态添加类
        if (this.isFavorited(timerId)) {
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

    // 创建反馈元素
    createFeedback() {
        if (!this.feedback) {
            this.feedback = document.createElement('div');
            this.feedback.className = 'timer-favorite-feedback';
            this.feedback.innerHTML = `
                <i data-lucide="star"></i>
                <span class="feedback-text">已收藏</span>
            `;
            document.body.appendChild(this.feedback);
        }
    }

    // 隐藏反馈
    hideFeedback() {
        if (this.feedback) {
            this.feedback.classList.remove('show');
        }
    }

    // 排序计时器（收藏的在前）
    sortTimers() {
        if (window.timers && Array.isArray(window.timers)) {
            return [...window.timers].sort((a, b) => {
                const aFavorited = this.isFavorited(a.id);
                const bFavorited = this.isFavorited(b.id);
                
                if (aFavorited && !bFavorited) return -1;
                if (!aFavorited && bFavorited) return 1;
                return 0;
            });
        }
        return [];
    }

    // 为卡片添加收藏按钮（现在按钮已经在HTML中，只需要更新状态）
    addFavoriteButtonToCard(card, timerId) {
        // 查找现有的收藏按钮
        const favoriteButton = card.querySelector('.timer-favorite-button');
        if (!favoriteButton) {
            console.log(`未找到计时器 ${timerId} 的收藏按钮`);
            return;
        }
        
        console.log(`找到计时器 ${timerId} 的收藏按钮，正在更新状态`);

        const isFavorited = this.isFavorited(timerId);
        
        // 更新按钮状态
        favoriteButton.classList.remove('favorited');
        if (isFavorited) {
            favoriteButton.classList.add('favorited');
        }
        
        // 更新按钮文本
        const span = favoriteButton.querySelector('span');
        if (span) {
            span.textContent = isFavorited ? '已收藏' : '收藏';
        }

        // 更新卡片外观
        this.updateCardAppearance(card, timerId);
    }

    // 初始化所有卡片
    initializeAllCards() {
        const timerCards = document.querySelectorAll('[data-timer-id]');
        console.log(`找到 ${timerCards.length} 个计时器卡片，正在初始化收藏按钮`);
        timerCards.forEach(card => {
            const timerId = card.getAttribute('data-timer-id');
            if (timerId) {
                this.addFavoriteButtonToCard(card, timerId);
            }
        });
    }

    // 获取收藏的计时器列表
    getFavoriteTimers(timers) {
        return timers.filter(timer => this.isFavorited(timer.id));
    }

    // 获取非收藏的计时器列表
    getNonFavoriteTimers(timers) {
        return timers.filter(timer => !this.isFavorited(timer.id));
    }

    // 获取收藏数量
    getFavoriteCount() {
        return this.favorites.size;
    }

    // 清空所有收藏
    clearAllFavorites() {
        this.favorites.clear();
        this.saveFavorites();
        
        // 更新所有卡片
        const timerCards = document.querySelectorAll('[data-timer-id]');
        timerCards.forEach(card => {
            const timerId = card.getAttribute('data-timer-id');
            if (timerId) {
                this.updateCardAppearance(card, timerId);
                const favoriteButton = card.querySelector('.timer-favorite-button');
                if (favoriteButton) {
                    favoriteButton.classList.remove('favorited');
                    const span = favoriteButton.querySelector('span');
                    if (span) span.textContent = '收藏';
                }
            }
        });
    }
}

// 创建全局计时器收藏管理器实例
const timerFavoriteManager = new TimerFavoriteManager();

// 初始化计时器收藏功能
function initializeTimerFavoriteFeature() {
    console.log('初始化计时器收藏功能...');
    
    // 添加收藏过滤按钮到搜索过滤器
    const timerFilters = document.querySelector('#timerPanel .search-filters');
    if (timerFilters && !timerFilters.querySelector('[data-filter="favorite"]')) {
        const favoriteFilter = document.createElement('button');
        favoriteFilter.className = 'filter-btn';
        favoriteFilter.setAttribute('data-filter', 'favorite');
        favoriteFilter.onclick = () => filterTimers('favorite');
        favoriteFilter.innerHTML = `
            <i data-lucide="star"></i>
            收藏
        `;
        timerFilters.appendChild(favoriteFilter);
        console.log('已添加计时器收藏过滤按钮');
    }

    // 初始化所有现有卡片
    timerFavoriteManager.initializeAllCards();

    // 监听DOM变化，为新添加的卡片添加收藏按钮
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.hasAttribute && node.hasAttribute('data-timer-id')) {
                        const timerId = node.getAttribute('data-timer-id');
                        timerFavoriteManager.addFavoriteButtonToCard(node, timerId);
                    }
                    const timerCards = node.querySelectorAll && node.querySelectorAll('[data-timer-id]');
                    if (timerCards) {
                        timerCards.forEach(card => {
                            const timerId = card.getAttribute('data-timer-id');
                            timerFavoriteManager.addFavoriteButtonToCard(card, timerId);
                        });
                    }
                }
            });
        });
    });

    observer.observe(document.getElementById('timersList'), {
        childList: true,
        subtree: true
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 延迟初始化，确保其他功能已经加载
    setTimeout(initializeTimerFavoriteFeature, 100);
});

// 导出函数供其他模块使用
window.timerFavoriteManager = timerFavoriteManager;
window.initializeTimerFavoriteFeature = initializeTimerFavoriteFeature; 